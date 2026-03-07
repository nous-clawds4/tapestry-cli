/**
 * tapestry event — manage nostr events in Neo4j
 *
 * Thin client: check/update via server API, import via batch API calls.
 */

import { apiGet, apiPost } from '../lib/api.js';
import { setJsonCommand } from './event-set-json.js';

/**
 * Scan strfry for events matching a filter.
 */
async function strfryScan(filter) {
  const data = await apiGet(`/api/strfry/scan?filter=${encodeURIComponent(JSON.stringify(filter))}`);
  if (!data.success) throw new Error(data.error || 'strfry scan failed');
  return data.events;
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
        const data = await apiGet(`/api/neo4j/event-check?uuid=${encodeURIComponent(uuid)}`);
        if (!data.success) {
          console.error(`\n❌ ${data.error}\n`);
          process.exit(1);
        }
        const r = data;
        console.log();
        console.log(`  UUID:   ${uuid}`);
        console.log(`  Status: ${r.status}`);
        if (r.neo4j) {
          console.log(`  Neo4j:  id=${r.neo4j.id?.slice(0, 16)}…  created_at=${r.neo4j.created_at}`);
        } else {
          console.log(`  Neo4j:  not found`);
        }
        if (r.strfry) {
          console.log(`  Strfry: id=${r.strfry.id?.slice(0, 16)}…  created_at=${r.strfry.created_at}`);
        } else {
          console.log(`  Strfry: not found`);
        }
        if (r.needsUpdate) {
          console.log(`  ➡️  Run 'tapestry event update ${uuid}' to update Neo4j`);
        }
        console.log();
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });

  cmd
    .command('update <uuid>')
    .description('Update a replaceable event in Neo4j with the latest from strfry')
    .action(async (uuid) => {
      try {
        const result = await apiPost('/api/neo4j/event-update', { uuid });
        if (!result.success) {
          console.error(`\n❌ ${result.error}\n`);
          process.exit(1);
        }
        console.log(`\n✅ Event ${result.action}: ${uuid}\n`);
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });

  setJsonCommand(cmd);

  cmd
    .command('import')
    .description('Import events from strfry into Neo4j by filter')
    .option('-f, --filter <json>', 'Raw nostr filter as JSON')
    .option('-i, --id <ids>', 'Comma-separated event IDs')
    .option('-k, --kinds <kinds>', 'Comma-separated event kinds (default: 9998,39998,9999,39999)')
    .option('-a, --author <pubkeys>', 'Comma-separated author pubkeys')
    .option('-t, --tag <tag...>', 'Tag filter as key=value (repeatable)')
    .option('-s, --since <timestamp>', 'Only events after this Unix timestamp', parseInt)
    .option('-u, --until <timestamp>', 'Only events before this Unix timestamp', parseInt)
    .option('-l, --limit <n>', 'Max events to import', parseInt)
    .option('--dry-run', 'Show filter and event count without importing')
    .action(async (opts) => {
      try {
        let filter;

        if (opts.filter) {
          try { filter = JSON.parse(opts.filter); }
          catch (e) { console.error(`  ❌ Invalid JSON: ${e.message}`); process.exit(1); }
        } else {
          filter = {};
          if (opts.id) filter.ids = opts.id.split(',').map(s => s.trim());
          if (opts.kinds) filter.kinds = opts.kinds.split(',').map(Number);
          else if (!opts.id) filter.kinds = [9998, 39998, 9999, 39999];
          if (opts.author) filter.authors = opts.author.split(',').map(s => s.trim());
          if (opts.tag) {
            for (const tagExpr of opts.tag) {
              const eq = tagExpr.indexOf('=');
              if (eq < 1) { console.error(`  ❌ Invalid tag: "${tagExpr}"`); process.exit(1); }
              const key = `#${tagExpr.slice(0, eq).trim()}`;
              if (!filter[key]) filter[key] = [];
              filter[key].push(tagExpr.slice(eq + 1).trim());
            }
          }
          if (opts.since) filter.since = opts.since;
          if (opts.until) filter.until = opts.until;
          if (opts.limit) filter.limit = opts.limit;
        }

        console.log(`  📡 Scanning strfry: ${JSON.stringify(filter)}`);
        const events = await strfryScan(filter);
        console.log(`  Found ${events.length} event(s)`);

        if (events.length === 0) return;

        // Preview
        for (const ev of events.slice(0, 20)) {
          const name = ev.tags?.find(t => t[0] === 'names')?.[1]
            || ev.tags?.find(t => t[0] === 'name')?.[1]
            || '(unnamed)';
          console.log(`     ${ev.kind}  ${ev.id.slice(0, 12)}…  ${name}`);
        }
        if (events.length > 20) console.log(`     … and ${events.length - 20} more`);

        if (opts.dryRun) {
          console.log(`\n  🏜️  Dry run — nothing imported.`);
          return;
        }

        // Import each event via the server's event-update endpoint
        console.log(`\n  📊 Importing ${events.length} event(s) to Neo4j...`);
        let imported = 0, failed = 0;
        for (const ev of events) {
          const uuid = ev.kind >= 30000
            ? `${ev.kind}:${ev.pubkey}:${(ev.tags.find(t => t[0] === 'd') || [])[1] || ''}`
            : ev.id;
          try {
            await apiPost('/api/neo4j/event-update', { uuid });
            imported++;
          } catch {
            failed++;
          }
        }
        console.log(`  ✅ Imported: ${imported}, Failed: ${failed}`);
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
