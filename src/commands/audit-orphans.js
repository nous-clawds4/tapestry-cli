/**
 * tapestry audit orphans — Find nodes with broken or missing parent references
 * Calls GET /api/audit/orphans and renders the result.
 */

import { fetchAuditOrphans } from '../lib/audit-api.js';
import { section, table, check } from '../lib/audit-helpers.js';

export function auditOrphansCommand(audit) {
  audit
    .command('orphans')
    .description('Find nodes with broken or missing parent references')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const result = await fetchAuditOrphans();
        if (!result.success) throw new Error(result.error);

        console.log('\n🔍 Orphan Node Audit\n');
        const { brokenZ, noZ, empty } = result.data;

        section('Broken z-tag references');
        check('Broken z-tag references', brokenZ.length);
        if (brokenZ.length > 0) table(brokenZ, [
          { key: 'item', label: 'Item', width: 40 },
          { key: 'brokenZTag', label: 'z-tag (missing parent)', width: 50 },
        ]);

        section('Missing z-tag');
        check('Items without z-tag', noZ.length);
        if (noZ.length > 0) table(noZ, [
          { key: 'item', label: 'Item', width: 40 },
          { key: 'uuid', label: 'UUID', width: 50 },
        ]);

        section('Empty concepts');
        check('Empty concepts (no elements)', empty.length, empty.length > 0 ? 'not necessarily a problem' : undefined);
        if (empty.length > 0) table(empty, [
          { key: 'concept', label: 'Concept', width: 40 },
          { key: 'uuid', label: 'UUID', width: 50 },
        ]);

        if (opts.json) console.log('\n' + JSON.stringify(result, null, 2));
        console.log('');
      } catch (err) {
        console.error(`\n  ❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
