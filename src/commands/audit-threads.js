/**
 * tapestry audit threads — Class thread traversal queries
 * Calls GET /api/audit/threads and renders the result.
 */

import { fetchAuditThreads } from '../lib/audit-api.js';
import { section, table } from '../lib/audit-helpers.js';

export function auditThreadsCommand(audit) {
  audit
    .command('threads [concept]')
    .description('Traverse class threads for a concept (or all concepts)')
    .option('--elements', 'Show leaf elements')
    .option('--paths', 'Show full paths (superset → sets → elements)')
    .option('--sets', 'Show only intermediate sets')
    .option('--through <set>', 'Only paths that traverse a specific set')
    .option('--depth <n>', 'Max traversal depth', parseInt)
    .option('--json', 'Output as JSON')
    .action(async (concept, opts) => {
      try {
        const mode = opts.paths ? 'paths' : opts.sets ? 'sets' : 'elements';
        const result = await fetchAuditThreads({
          concept,
          mode: concept ? mode : undefined,
          through: opts.through,
          depth: opts.depth,
        });
        if (!result.success) throw new Error(result.error);

        if (!concept) {
          // Summary mode
          console.log('\n🧵 Class Thread Summary (all concepts)\n');
          table(result.data, [
            { key: 'concept', label: 'Concept', width: 35 },
            { key: 'sets', label: 'Sets', width: 8 },
            { key: 'elements', label: 'Elements', width: 10 },
          ]);
          console.log(`\n  ${result.data.length} concepts with wired class threads\n`);
        } else {
          console.log(`\n🧵 Class Threads: "${concept}"\n`);

          if (result.header) {
            console.log(`  Header:   ${result.header.name} (${result.header.uuid})`);
            console.log(`  Superset: ${result.header.supersetName} (${result.header.supersetUuid})`);
          }

          if (result.mode === 'paths') {
            section('Full paths');
            for (const p of result.data) {
              const names = Array.isArray(p.path) ? p.path : String(p.path).replace(/[\[\]"]/g, '').split(',').map(s => s.trim());
              console.log(`  ${names.join(' → ')}`);
            }
            console.log(`\n  ${result.data.length} paths`);
          } else if (result.mode === 'sets') {
            section('Sets (intermediate nodes)');
            table(result.data, [
              { key: 'name', label: 'Set', width: 45 },
              { key: 'uuid', label: 'UUID', width: 50 },
            ]);
            console.log(`\n  ${result.data.length} sets`);
          } else {
            section('Elements');
            table(result.data, [
              { key: 'name', label: 'Element', width: 45 },
              { key: 'uuid', label: 'UUID', width: 50 },
            ]);
            console.log(`\n  ${result.data.length} elements`);
          }
        }

        if (opts.json) console.log('\n' + JSON.stringify(result, null, 2));
        console.log('');
      } catch (err) {
        console.error(`\n  ❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
