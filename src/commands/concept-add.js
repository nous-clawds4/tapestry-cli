/**
 * tapestry concept add <concept> <item-name> — add an item to a concept
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { apiGet } from '../lib/api.js';
import { signEvent } from '../lib/signer.js';

const execAsync = promisify(execCb);
const CONTAINER = 'tapestry-tapestry-1';

/**
 * Run a Cypher query and return parsed results.
 */
async function cypher(query) {
  const encoded = encodeURIComponent(query);
  const data = await apiGet(`/api/neo4j/run-query?cypher=${encoded}`);
  if (!data.success) throw new Error(data.error || 'Query failed');
  const raw = (data.cypherResults || '').trim();
  if (!raw) return [];
  const lines = raw.split('\n');
  const header = lines[0].split(', ').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { values.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    values.push(current.trim());
    const row = {};
    header.forEach((h, i) => { row[h] = values[i] || null; });
    return row;
  });
}

/**
 * Find a concept by name. Returns { uuid, concept, plural } or null.
 */
async function findConcept(name) {
  const rows = await cypher(
    `MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) ` +
    `WHERE toLower(t.value) = toLower('${name.replace(/'/g, "\\'")}') ` +
    `RETURN DISTINCT h.uuid AS uuid, t.value AS concept, t.value1 AS plural LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

export function addItemCommand(concept) {
  concept
    .command('add <concept-name> <item-name>')
    .description('Add an item (kind 39999) to an existing concept')
    .option('--description <text>', 'Description of the item')
    .option('--d-tag <id>', 'Custom d-tag (default: random 8-char hex)')
    .option('--personal', 'Sign with personal nsec from 1Password')
    .option('--no-import', 'Skip Neo4j import after creating')
    .option('--publish', 'Also publish to remote relays')
    .action(async (conceptName, itemName, opts) => {
      await addItem(conceptName, itemName, opts);
    });
}

async function addItem(conceptName, itemName, opts) {
  console.log(`\n🧵 Adding item "${itemName}" to concept "${conceptName}"\n`);

  // Find the parent concept
  const parent = await findConcept(conceptName);
  if (!parent) {
    console.error(`  ❌ Concept "${conceptName}" not found. Use 'tapestry concept list' to see available concepts.`);
    process.exit(1);
  }

  console.log(`  📌 Parent: "${parent.concept}" (${parent.uuid})`);

  // Build tags
  const dTag = opts.dTag || randomBytes(4).toString('hex');
  const tags = [
    ['d', dTag],
    ['name', itemName],
    ['z', parent.uuid],
  ];

  if (opts.description) {
    tags.push(['description', opts.description]);
  }

  // Sign the event
  console.log('  📝 Building kind 39999 event...');
  let event;
  try {
    event = await signEvent({
      kind: 39999,
      tags,
      content: '',
    }, { personal: opts.personal });
  } catch (err) {
    console.error(`  ❌ Signing failed: ${err.message}`);
    process.exit(1);
  }

  console.log(`  ✅ Signed by ${event._signerLabel} (${event.pubkey.slice(0, 12)}...)`);
  console.log(`     d-tag:   ${dTag}`);
  console.log(`     z-tag:   ${parent.uuid}`);
  console.log(`     Name:    ${itemName}`);
  if (opts.description) console.log(`     Desc:    ${opts.description}`);

  // Write to local strfry
  console.log('\n  📡 Importing to local strfry...');
  try {
    const eventJson = JSON.stringify(event);
    const cmd = `echo '${eventJson.replace(/'/g, "'\\''")}' | docker exec -i ${CONTAINER} strfry import 2>&1`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
    const output = (stdout || '') + (stderr || '');
    const summaryMatch = output.match(/(\d+) added, (\d+) rejected, (\d+) dups/);
    if (summaryMatch) {
      const [, added, rejected, dups] = summaryMatch;
      if (parseInt(rejected) > 0) {
        console.log(`  ⚠️  ${added} added, ${rejected} rejected, ${dups} dups`);
      } else if (parseInt(dups) > 0) {
        console.log(`  ℹ️  Event already exists in strfry (duplicate)`);
      } else {
        console.log(`  ✅ Event written to strfry`);
      }
    } else {
      console.log(`  ✅ Event sent to strfry`);
    }
  } catch (err) {
    console.error(`  ❌ strfry import failed: ${err.message}`);
    process.exit(1);
  }

  // Publish to remote relays
  if (opts.publish) {
    console.log('\n  🌐 Publishing to remote relays...');
    const relays = [
      'wss://dcosl.brainstorm.world',
      'wss://dcosl.brainstorm.social/relay',
    ];
    for (const relay of relays) {
      try {
        const cmd = `docker exec ${CONTAINER} strfry sync ${relay} --filter '{"ids":["${event.id}"]}' --dir up 2>&1`;
        await execAsync(cmd, { timeout: 30000 });
        console.log(`     ✅ ${relay}`);
      } catch (err) {
        console.log(`     ❌ ${relay}: ${err.message.split('\n').pop()}`);
      }
    }
  }

  // Import into Neo4j
  if (opts.import !== false) {
    console.log('\n  📊 Importing into Neo4j...');
    try {
      const { stdout } = await execAsync(
        `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/batchTransfer.sh`,
        { timeout: 120000 }
      );
      await execAsync(
        `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/setup.sh`,
        { timeout: 60000 }
      );
      const eventMatch = stdout.match(/Found (\d+) events/);
      const tagMatch = stdout.match(/Created (\d+) tag objects/);
      console.log(`  ✅ ${eventMatch?.[1] || '?'} events → ${tagMatch?.[1] || '?'} tags`);
      console.log('  ✅ Labels and relationships applied');
    } catch (err) {
      console.error(`  ❌ Import failed: ${err.message}`);
    }
  }

  console.log(`\n✨ Item "${itemName}" added to "${parent.concept}"!\n`);
}
