/**
 * tapestry audit bios — Verify BIOS is fully formed
 *
 * Calls GET /api/audit/bios and renders the result.
 */

import { fetchAuditBios } from '../lib/audit-api.js';
import { section, table, check } from '../lib/audit-helpers.js';

export function auditBiosCommand(audit) {
  audit
    .command('bios')
    .description('Verify BIOS is fully formed (all 11 canonical concepts with skeletons)')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        await runBios(opts);
      } catch (err) {
        console.error(`\n  ❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}

async function runBios(opts) {
  console.log('\n🧬 BIOS Audit\n');

  const result = await fetchAuditBios();
  if (!result.success) throw new Error(result.error || 'API call failed');

  const { data, summary, biosReady } = result;

  section('BIOS Concepts');

  const displayRows = data.map(r => ({
    name: r.concept,
    status: r.complete ? '✅ Complete' : r.exists ? '⚠️  Partial' : '❌ Missing',
    cth: r.cth ? '✅' : '❌',
    sup: r.superset ? '✅' : '❌',
    sch: r.schema ? '✅' : '❌',
    core: r.coreGraph ? '✅' : '❌',
    ctg: r.ctGraph ? '✅' : '❌',
    ptg: r.ptGraph ? '✅' : '❌',
    json: r.json ? '✅' : '❌',
  }));

  table(displayRows, [
    { key: 'name', label: 'Concept', width: 20 },
    { key: 'status', label: 'Status', width: 14 },
    { key: 'cth', label: 'CTH', width: 3 },
    { key: 'sup', label: 'Sup', width: 3 },
    { key: 'sch', label: 'Sch', width: 3 },
    { key: 'core', label: 'Core', width: 4 },
    { key: 'ctg', label: 'CTG', width: 3 },
    { key: 'ptg', label: 'PTG', width: 3 },
    { key: 'json', label: 'JSON', width: 4 },
  ]);

  section('Summary');
  console.log(`  Complete:  ${summary.complete} / ${summary.total}`);
  console.log(`  Partial:   ${summary.partial}`);
  console.log(`  Missing:   ${summary.missing}`);
  console.log(`\n  ${biosReady ? '✅ BIOS is fully formed!' : '⚠️  BIOS is incomplete — run BIOS scripts to fix'}`);

  if (opts.json) {
    console.log('\n' + JSON.stringify(result, null, 2));
  }

  console.log('');
}
