/**
 * tapestry audit health — full health check across all audit dimensions
 *
 * Runs all checks in one call and presents a pass/warn/fail summary.
 * Designed for quick triage: what's healthy, what needs attention.
 */

import { fetchAuditHealth } from '../lib/audit-api.js';
import { fmt, section } from '../lib/audit-helpers.js';

export function auditHealthCommand(audit) {
  audit
    .command('health')
    .description('Full health check — runs all audit checks with summary')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      try {
        const res = await fetchAuditHealth();
        if (!res.success) {
          console.error('Error:', res.error);
          process.exit(1);
        }

        if (opts.json) {
          console.log(JSON.stringify(res, null, 2));
          return;
        }

        const { status, stats, checks } = res;

        // Overall status banner
        const statusIcon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
        const statusLabel = status === 'pass' ? 'HEALTHY' : status === 'warn' ? 'WARNINGS' : 'ISSUES FOUND';

        section(`${statusIcon} Concept Graph Health: ${statusLabel}`);

        // Graph stats
        console.log(`  Nodes: ${fmt(stats.nodes)}  |  Relationships: ${fmt(stats.relationships)}  |  Concepts: ${fmt(stats.concepts)}`);
        console.log();

        // Checks table
        const nameWidth = Math.max(...checks.map(c => c.name.length), 6);

        for (const check of checks) {
          const icon = check.status === 'pass' ? '✅'
            : check.status === 'warn' ? '⚠️ '
            : check.status === 'info' ? 'ℹ️ '
            : '❌';
          const name = check.name.padEnd(nameWidth);
          console.log(`  ${icon} ${name}  ${check.summary}`);
        }

        console.log();

        // Drill-down hints for non-pass checks
        const issues = checks.filter(c => c.status !== 'pass');
        if (issues.length > 0) {
          console.log('  Drill down:');
          for (const check of issues) {
            const cmd = checkToCommand(check.name);
            if (cmd) console.log(`    tapestry audit ${cmd}`);
          }
          console.log();
        }
      } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}

function checkToCommand(name) {
  const map = {
    'BIOS': 'bios',
    'Skeletons': 'skeletons',
    'Orphans': 'orphans',
    'Empty Concepts': 'skeletons',
    'Wiring': 'wiring',
    'Labels': 'labels',
  };
  return map[name] || null;
}
