/**
 * tapestry event — manage nostr events in Neo4j
 *
 * Subcommands:
 *   import <filter>   — import events from strfry into Neo4j
 *   update <uuid>     — update a replaceable event node in Neo4j with the latest from strfry
 *   check <uuid>      — check if an event exists in Neo4j and compare with strfry
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { apiGet } from '../lib/api.js';
import { importToNeo4j } from '../lib/neo4j.js';
import { getConfig } from '../lib/config.js';
import { setJsonCommand } from './event-set-json.js';

const execAsync = promisify(execCb);

/**
 * Scan strfry for events matching a filter.
 */
async function strfryScan(filter) {
  const data = await apiGet(`/api/strfry/scan?filter=${encodeURIComponent(JSON.stringify(filter))}`);
  if (!data.success) throw new Error(data.error || 'strfry scan failed');
  return data.events;
}

/**
 * Run a Cypher query via the API and parse CSV results.
 */
async function cypher(query) {
  const encoded = encodeURIComponent(query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
  const data = await apiGet(`/api/neo4j/run-query?cypher=${encoded}`);
  if (!data.success) throw new Error(data.error || 'Query failed');
  return parseCypherCSV(data.cypherResults);
}

function parseCypherCSV(raw) {
  if (!raw || !raw.trim()) return [];
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] === 'NULL' ? null : vals[i]; });
    return row;
  });
}

/**
 * Escape single quotes for Cypher strings.
 */
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Check if an event exists in Neo4j by uuid and compare with strfry.
 * Returns { inNeo4j, neo4jNode, strfryEvent, needsUpdate, status }
 */
async function checkEvent(uuid) {
  // Query Neo4j
  const rows = await cypher(
    `MATCH (e:NostrEvent {uuid: '${esc(uuid)}'}) RETURN e.id AS id, e.created_at AS created_at, e.uuid AS uuid, e.name AS name`
  );
  const neo4jNode = rows.length > 0 ? rows[0] : null;

  // Query strfry for the latest version
  let strfryEvent = null;
  if (uuid.startsWith('39998:') || uuid.startsWith('39999:')) {
    const parts = uuid.split(':');
    const kind = parseInt(parts[0], 10);
    const pubkey = parts[1];
    const dTag = parts.slice(2).join(':');
    const events = await strfryScan({ kinds: [kind], authors: [pubkey], '#d': [dTag] });
    if (events.length > 0) strfryEvent = events[0];
  } else {
    const events = await strfryScan({ ids: [uuid] });
    if (events.length > 0) strfryEvent = events[0];
  }

  if (!neo4jNode && !strfryEvent) {
    return { inNeo4j: false, neo4jNode: null, strfryEvent: null, needsUpdate: false, status: 'not_found' };
  }
  if (!neo4jNode && strfryEvent) {
    return { inNeo4j: false, neo4jNode: null, strfryEvent, needsUpdate: false, status: 'missing_from_neo4j' };
  }
  if (neo4jNode && !strfryEvent) {
    return { inNeo4j: true, neo4jNode, strfryEvent: null, needsUpdate: false, status: 'missing_from_strfry' };
  }

  // Both exist — compare
  const neo4jCreatedAt = parseInt(neo4jNode.created_at, 10);
  const strfryCreatedAt = strfryEvent.created_at;
  const idsMatch = neo4jNode.id === strfryEvent.id;

  if (idsMatch) {
    return { inNeo4j: true, neo4jNode, strfryEvent, needsUpdate: false, status: 'in_sync' };
  }

  if (strfryCreatedAt > neo4jCreatedAt) {
    return { inNeo4j: true, neo4jNode, strfryEvent, needsUpdate: true, status: 'neo4j_outdated' };
  }

  // Neo4j has a newer or same-age version with different id — unusual
  return { inNeo4j: true, neo4jNode, strfryEvent, needsUpdate: false, status: 'neo4j_newer_or_conflict' };
}

/**
 * Delete all tags connected to an event node, then the HAS_TAG relationships.
 * This cleanly removes old tag data before re-importing.
 */
function buildDeleteTagsStatements(eventUuid) {
  return [
    // Delete tag nodes and their relationships
    `MATCH (e:NostrEvent {uuid: '${esc(eventUuid)}'})-[r:HAS_TAG]->(t:NostrEventTag) DETACH DELETE t`,
  ];
}

/**
 * Update a replaceable event in Neo4j:
 * 1. Delete old tags
 * 2. Re-import the event (MERGE on uuid updates properties, creates new tags)
 */
async function updateEvent(uuid, opts = {}) {
  const log = opts.quiet ? () => {} : console.log;

  const check = await checkEvent(uuid);

  if (check.status === 'not_found') {
    log(`  ❌ Event ${uuid} not found in strfry or Neo4j`);
    return false;
  }

  if (check.status === 'missing_from_neo4j') {
    log(`  📥 Event not in Neo4j — importing fresh...`);
    await importToNeo4j([check.strfryEvent], opts);
    log(`  ✅ Imported to Neo4j`);
    return true;
  }

  if (check.status === 'in_sync') {
    log(`  ✅ Already in sync (id: ${check.neo4jNode.id?.slice(0, 16)}…)`);
    return true;
  }

  if (check.status === 'neo4j_outdated') {
    log(`  🔄 Neo4j is outdated:`);
    log(`     Neo4j:  id=${check.neo4jNode.id?.slice(0, 16)}…  created_at=${check.neo4jNode.created_at}`);
    log(`     Strfry: id=${check.strfryEvent.id?.slice(0, 16)}…  created_at=${check.strfryEvent.created_at}`);

    // Step 1: Delete old tags
    log(`  🗑️  Removing old tags...`);
    const deleteStatements = buildDeleteTagsStatements(uuid);
    const tmpFile = `/tmp/cypher_update_${Date.now()}.cypher`;
    writeFileSync(tmpFile, deleteStatements.map(s => s.trim() + ';').join('\n') + '\n');
    try {
      await execAsync(
        `docker exec -i ${getConfig('docker.container')} cypher-shell -u ${getConfig('neo4j.user')} -p '${getConfig('neo4j.password')}' < ${tmpFile}`,
        { timeout: 30000 }
      );
    } finally {
      try { unlinkSync(tmpFile); } catch {}
    }

    // Step 2: Re-import with new event data
    log(`  📥 Importing updated event...`);
    await importToNeo4j([check.strfryEvent], opts);
    log(`  ✅ Updated in Neo4j`);
    return true;
  }

  if (check.status === 'missing_from_strfry') {
    log(`  ⚠️  Event exists in Neo4j but not in strfry — orphaned node`);
    return false;
  }

  if (check.status === 'neo4j_newer_or_conflict') {
    log(`  ⚠️  Conflict: Neo4j has a different version (same or newer timestamp)`);
    log(`     Neo4j:  id=${check.neo4jNode.id?.slice(0, 16)}…  created_at=${check.neo4jNode.created_at}`);
    log(`     Strfry: id=${check.strfryEvent.id?.slice(0, 16)}…  created_at=${check.strfryEvent.created_at}`);
    return false;
  }

  return false;
}

/**
 * Register the `tapestry event` command group.
 */
export function eventCommand(program) {
  const cmd = program.command('event').description('Manage nostr events in Neo4j');

  cmd
    .command('check <uuid>')
    .description('Check if an event exists in Neo4j and compare with strfry')
    .action(async (uuid) => {
      try {
        const result = await checkEvent(uuid);
        console.log();
        console.log(`  UUID: ${uuid}`);
        console.log(`  Status: ${result.status}`);
        if (result.neo4jNode) {
          console.log(`  Neo4j:  id=${result.neo4jNode.id?.slice(0, 16)}…  created_at=${result.neo4jNode.created_at}  name=${result.neo4jNode.name || '(none)'}`);
        } else {
          console.log(`  Neo4j:  not found`);
        }
        if (result.strfryEvent) {
          const name = result.strfryEvent.tags?.find(t => t[0] === 'names')?.[1] || result.strfryEvent.tags?.find(t => t[0] === 'name')?.[1] || '(none)';
          console.log(`  Strfry: id=${result.strfryEvent.id?.slice(0, 16)}…  created_at=${result.strfryEvent.created_at}  name=${name}`);
        } else {
          console.log(`  Strfry: not found`);
        }
        if (result.needsUpdate) {
          console.log(`  ➡️  Run 'tapestry event update ${uuid}' to update Neo4j`);
        }
        console.log();
      } catch (err) {
        console.error(`  ❌ ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('update <uuid>')
    .description('Update a replaceable event in Neo4j with the latest from strfry (or import if missing)')
    .action(async (uuid) => {
      try {
        await updateEvent(uuid);
      } catch (err) {
        console.error(`  ❌ ${err.message}`);
        process.exit(1);
      }
    });

  setJsonCommand(cmd);

  cmd
    .command('import')
    .description('Import events from strfry into Neo4j by filter')
    .option('-f, --filter <json>', 'Raw nostr filter as JSON (overrides all other filter flags)')
    .option('-i, --id <ids>', 'Comma-separated event IDs')
    .option('-k, --kinds <kinds>', 'Comma-separated event kinds (default: 9998,39998,9999,39999)')
    .option('-a, --author <pubkeys>', 'Comma-separated author pubkeys')
    .option('-t, --tag <tag...>', 'Tag filter as key=value (repeatable, e.g. -t d=abc123 -t z=39998:...)')
    .option('-s, --since <timestamp>', 'Only events created after this Unix timestamp', parseInt)
    .option('-u, --until <timestamp>', 'Only events created before this Unix timestamp', parseInt)
    .option('-l, --limit <n>', 'Max events to import', parseInt)
    .option('--search <query>', 'Full-text search (if relay supports NIP-50)')
    .option('--dry-run', 'Show filter and event count without importing')
    .action(async (opts) => {
      try {
        let filter;

        if (opts.filter) {
          // --filter takes precedence: parse raw JSON nostr filter
          try {
            filter = JSON.parse(opts.filter);
          } catch (e) {
            console.error(`  ❌ Invalid JSON in --filter: ${e.message}`);
            process.exit(1);
          }
        } else {
          // Build filter from individual flags
          filter = {};

          if (opts.id) {
            filter.ids = opts.id.split(',').map(s => s.trim());
          }

          if (opts.kinds) {
            filter.kinds = opts.kinds.split(',').map(Number);
          } else if (!opts.id) {
            // Default kinds only when no explicit IDs given
            filter.kinds = [9998, 39998, 9999, 39999];
          }

          if (opts.author) {
            filter.authors = opts.author.split(',').map(s => s.trim());
          }

          // Tag filters: -t d=abc123 -t z=39998:pubkey:dtag
          // Becomes: { "#d": ["abc123"], "#z": ["39998:pubkey:dtag"] }
          if (opts.tag) {
            for (const tagExpr of opts.tag) {
              const eq = tagExpr.indexOf('=');
              if (eq < 1) {
                console.error(`  ❌ Invalid tag filter: "${tagExpr}" (expected key=value)`);
                process.exit(1);
              }
              const key = tagExpr.slice(0, eq).trim();
              const value = tagExpr.slice(eq + 1).trim();
              const filterKey = `#${key}`;
              if (!filter[filterKey]) filter[filterKey] = [];
              filter[filterKey].push(value);
            }
          }

          if (opts.since) filter.since = opts.since;
          if (opts.until) filter.until = opts.until;
          if (opts.limit) filter.limit = opts.limit;
          if (opts.search) filter.search = opts.search;
        }

        console.log(`  📡 Scanning strfry with filter:`);
        console.log(`     ${JSON.stringify(filter)}`);
        const events = await strfryScan(filter);
        console.log(`  Found ${events.length} event(s)`);

        if (events.length === 0) return;

        // Show a preview of what was found
        if (events.length <= 10 || opts.dryRun) {
          console.log('');
          for (const ev of events.slice(0, 20)) {
            const name = ev.tags?.find(t => t[0] === 'names')?.[1]
              || ev.tags?.find(t => t[0] === 'name')?.[1]
              || '(unnamed)';
            const kind = ev.kind;
            const age = Math.floor((Date.now() / 1000 - ev.created_at) / 3600);
            console.log(`     ${kind}  ${ev.id.slice(0, 12)}…  ${name}  (${age}h ago)`);
          }
          if (events.length > 20) console.log(`     … and ${events.length - 20} more`);
          console.log('');
        }

        if (opts.dryRun) {
          console.log(`  🏜️  Dry run — nothing imported.`);
          return;
        }

        console.log(`  📊 Importing ${events.length} event(s) to Neo4j...`);
        await importToNeo4j(events);
        console.log(`  ✅ Done`);
      } catch (err) {
        console.error(`  ❌ ${err.message}`);
        process.exit(1);
      }
    });
}

// Export for use by API endpoints
export { checkEvent, updateEvent };
