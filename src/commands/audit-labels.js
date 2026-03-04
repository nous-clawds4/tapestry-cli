/**
 * tapestry audit labels — Find nodes missing expected Neo4j labels
 * Calls GET /api/audit/labels and renders the result.
 */

import { fetchAuditLabels } from '../lib/audit-api.js';
import { section, table, check } from '../lib/audit-helpers.js';

export function auditLabelsCommand(audit) {
  audit
    .command('labels')
    .description('Find nodes missing expected Neo4j labels')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const result = await fetchAuditLabels();
        if (!result.success) throw new Error(result.error);

        console.log('\n🏷️  Label Audit\n');

        let totalIssues = 0;
        for (const item of result.data) {
          totalIssues += item.count;
          check(`${item.label} label (${item.concept})`, item.count);
          if (item.count > 0) {
            table(item.missing, [
              { key: item.missing[0]?.concept ? 'concept' : 'item', label: 'Name', width: 40 },
              { key: 'uuid', label: 'UUID', width: 50 },
            ]);
          }
        }

        section('Summary');
        check('Total label issues', totalIssues);

        if (opts.json) console.log('\n' + JSON.stringify(result, null, 2));
        console.log('');
      } catch (err) {
        console.error(`\n  ❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
