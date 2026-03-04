/**
 * tapestry audit wiring — Check for relationship type mismatches
 * Calls GET /api/audit/wiring and renders the result.
 */

import { fetchAuditWiring } from '../lib/audit-api.js';
import { section, table, check } from '../lib/audit-helpers.js';

export function auditWiringCommand(audit) {
  audit
    .command('wiring')
    .description('Check for relationship type mismatches (wrong node types connected)')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const result = await fetchAuditWiring();
        if (!result.success) throw new Error(result.error);

        console.log('\n🔌 Wiring Audit\n');

        let totalIssues = 0;
        for (const rule of result.data) {
          totalIssues += rule.count;
          check(rule.rule, rule.count);
          if (rule.count > 0) {
            table(rule.violations.map(v => ({
              from: `${v.fromNode || '?'} ${v.fromLabels || ''}`,
              to: `${v.toNode || '?'} ${v.toLabels || ''}`,
            })), [
              { key: 'from', label: 'From', width: 45 },
              { key: 'to', label: 'To', width: 45 },
            ]);
            console.log('');
          }
        }

        section('Summary');
        check('Total wiring violations', totalIssues);

        if (opts.json) console.log('\n' + JSON.stringify(result, null, 2));
        console.log('');
      } catch (err) {
        console.error(`\n  ❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
