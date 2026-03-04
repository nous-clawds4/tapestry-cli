/**
 * tapestry audit skeletons — Check concepts for missing core nodes
 * Calls GET /api/audit/skeletons and renders the result.
 */

import { fetchAuditSkeletons } from '../lib/audit-api.js';
import { section, table, check } from '../lib/audit-helpers.js';

export function auditSkeletonsCommand(audit) {
  audit
    .command('skeletons')
    .description('Check concepts for missing core nodes (superset, schema, graphs)')
    .option('--concept <name>', 'Check only a specific concept')
    .option('--complete', 'Show only complete skeletons')
    .option('--incomplete', 'Show only incomplete skeletons')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const result = await fetchAuditSkeletons(opts.concept);
        if (!result.success) throw new Error(result.error);

        console.log('\n🦴 Concept Skeleton Audit\n');

        let rows = result.data.map(r => {
          const complete = r.superset && r.schema && r.coreGraph && r.ctGraph && r.ptGraph;
          return { ...r, complete };
        });

        if (opts.complete) rows = rows.filter(r => r.complete);
        if (opts.incomplete) rows = rows.filter(r => !r.complete);

        const completeCount = result.data.filter(r => r.superset && r.schema && r.coreGraph && r.ctGraph && r.ptGraph).length;
        const incompleteCount = result.data.length - completeCount;

        section('Summary');
        check('Complete skeletons', 0, `${completeCount} of ${result.data.length}`);
        check('Incomplete skeletons', incompleteCount, incompleteCount > 0 ? `${incompleteCount} concepts missing nodes` : undefined);

        section('Details');
        table(rows.map(r => ({
          name: r.concept,
          superset: r.superset ? '✅' : '❌',
          schema: r.schema ? '✅' : '❌',
          coreGraph: r.coreGraph ? '✅' : '❌',
          ctGraph: r.ctGraph ? '✅' : '❌',
          ptGraph: r.ptGraph ? '✅' : '❌',
        })), [
          { key: 'name', label: 'Concept', width: 35 },
          { key: 'superset', label: 'Super', width: 5 },
          { key: 'schema', label: 'Schema', width: 6 },
          { key: 'coreGraph', label: 'Core', width: 5 },
          { key: 'ctGraph', label: 'CTG', width: 5 },
          { key: 'ptGraph', label: 'PTG', width: 5 },
        ]);

        if (opts.json) console.log('\n' + JSON.stringify(result, null, 2));
        console.log('');
      } catch (err) {
        console.error(`\n  ❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
