/**
 * tapestry event set-json <uuid> <json-or-file> — set the json tag on a replaceable event
 *
 * Fetches the current event from strfry, replaces (or adds) the `json` tag,
 * re-signs, re-publishes to strfry, and re-imports to Neo4j.
 *
 * Only works with replaceable events (kinds 30000+).
 *
 * Usage:
 *   tapestry event set-json <uuid> '{"foo":"bar"}'
 *   tapestry event set-json <uuid> @path/to/file.json
 *   tapestry event set-json <uuid> --remove     # remove the json tag
 */

import { readFileSync } from 'fs';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { apiGet } from '../lib/api.js';
import { signEvent } from '../lib/signer.js';
import { importToNeo4j } from '../lib/neo4j.js';
import { getConfig } from '../lib/config.js';

const execAsync = promisify(execCb);

/**
 * Scan strfry for a single replaceable event by a-tag UUID.
 */
async function fetchEvent(uuid) {
  const parts = uuid.split(':');
  if (parts.length < 3) throw new Error(`Invalid UUID (expected <kind>:<pubkey>:<d-tag>): ${uuid}`);

  const kind = parseInt(parts[0], 10);
  const pubkey = parts[1];
  const dTag = parts.slice(2).join(':');

  const filter = { kinds: [kind], authors: [pubkey], '#d': [dTag] };
  const data = await apiGet(`/api/strfry/scan?filter=${encodeURIComponent(JSON.stringify(filter))}`);
  if (!data.success) throw new Error(data.error || 'strfry scan failed');

  if (!data.events || data.events.length === 0) return null;
  return data.events[0];
}

/**
 * Publish a signed event to strfry.
 */
async function publishToStrfry(event) {
  const container = getConfig('docker.container');
  const eventJson = JSON.stringify(event);
  const cmd = `echo '${eventJson.replace(/'/g, "'\\''")}' | docker exec -i ${container} strfry import 2>&1`;
  const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
  const output = (stdout || '') + (stderr || '');
  const match = output.match(/(\d+) added, (\d+) rejected, (\d+) dups/);
  if (match && parseInt(match[2]) > 0) {
    throw new Error(`strfry rejected the event: ${output}`);
  }
}

/**
 * Set (or remove) the json tag on a replaceable event.
 *
 * Callable from CLI and programmatically (from createConcept, etc.).
 *
 * @param {string} uuid - The a-tag UUID of the event
 * @param {object} opts
 * @param {string} [opts.jsonString] - JSON string to set (mutually exclusive with remove)
 * @param {boolean} [opts.remove] - Remove the json tag
 * @param {boolean} [opts.personal] - Sign with personal nsec
 * @param {boolean} [opts.skipImport] - Skip Neo4j re-import
 * @param {boolean} [opts.quiet] - Suppress output
 * @returns {{ event: object, aTag: string }} The new signed event
 */
export async function setJsonTag(uuid, opts = {}) {
  const { jsonString, remove, personal, skipImport, quiet } = opts;
  const log = quiet ? () => {} : console.log;

  // 1. Fetch current event from strfry
  log(`\n  📡 Fetching event ${uuid.slice(0, 40)}…`);
  const existing = await fetchEvent(uuid);
  if (!existing) {
    throw new Error(`Event not found in strfry: ${uuid}`);
  }

  const name = existing.tags?.find(t => t[0] === 'names')?.[1]
    || existing.tags?.find(t => t[0] === 'name')?.[1]
    || '(unnamed)';
  log(`     Found: "${name}" (kind ${existing.kind})`);

  if (existing.kind < 30000) {
    throw new Error(`Only replaceable events (kind ≥ 30000) can be updated. This event is kind ${existing.kind}.`);
  }

  // 2. Build new tags: copy all existing tags, replace or add json
  let newTags;
  if (remove) {
    newTags = existing.tags.filter(t => t[0] !== 'json');
    log(`     🗑️  Removing json tag`);
  } else {
    // Validate the JSON
    try {
      JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`Invalid JSON: ${e.message}`);
    }

    const hasJson = existing.tags.some(t => t[0] === 'json');
    if (hasJson) {
      newTags = existing.tags.map(t => t[0] === 'json' ? ['json', jsonString] : t);
      log(`     🔄 Replacing existing json tag`);
    } else {
      newTags = [...existing.tags, ['json', jsonString]];
      log(`     ➕ Adding json tag`);
    }
  }

  // 3. Re-sign with new tags (creates a new event with updated created_at)
  log(`  📝 Re-signing event...`);
  const newEvent = await signEvent({
    kind: existing.kind,
    tags: newTags,
    content: existing.content || '',
  }, { personal });

  log(`     ✅ Signed by ${newEvent._signerLabel} (${newEvent.pubkey.slice(0, 12)}…)`);

  // 4. Publish to strfry (replaces the old version since same kind+pubkey+d-tag)
  log(`  📡 Publishing to strfry...`);
  await publishToStrfry(newEvent);
  log(`     ✅ Published`);

  // 5. Import to Neo4j
  if (!skipImport) {
    log(`  📊 Importing to Neo4j...`);
    // Use the updateEvent flow: delete old tags, re-import
    const { updateEvent } = await import('./event.js');
    await updateEvent(uuid, { quiet: true });
    log(`     ✅ Neo4j updated`);
  }

  const dTag = newEvent.tags.find(t => t[0] === 'd')?.[1];
  const aTag = `${newEvent.kind}:${newEvent.pubkey}:${dTag}`;

  log(`\n  ✨ Done! JSON tag ${remove ? 'removed from' : 'set on'} "${name}"\n`);

  return { event: newEvent, aTag };
}

/**
 * Register the `tapestry event set-json` subcommand.
 */
export function setJsonCommand(eventCmd) {
  eventCmd
    .command('set-json <uuid> [json]')
    .description('Set (or remove) the json tag on a replaceable event')
    .option('--file <path>', 'Read JSON from a file instead of the argument')
    .option('--remove', 'Remove the json tag')
    .option('--personal', 'Sign with personal nsec from 1Password')
    .option('--no-import', 'Skip Neo4j re-import')
    .action(async (uuid, jsonArg, opts) => {
      try {
        let jsonString;

        if (opts.remove) {
          // Remove mode — no JSON needed
        } else if (opts.file) {
          jsonString = readFileSync(opts.file, 'utf8').trim();
        } else if (jsonArg && jsonArg.startsWith('@')) {
          jsonString = readFileSync(jsonArg.slice(1), 'utf8').trim();
        } else if (jsonArg) {
          jsonString = jsonArg;
        } else {
          console.error('  ❌ Provide JSON as an argument, --file <path>, or @path');
          process.exit(1);
        }

        await setJsonTag(uuid, {
          jsonString,
          remove: opts.remove,
          personal: opts.personal,
          skipImport: opts.import === false,
        });
      } catch (err) {
        console.error(`\n  ❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
