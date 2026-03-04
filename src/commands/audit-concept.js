/**
 * tapestry audit concept <name> — comprehensive health check for a single concept
 *
 * Checks skeleton completeness, CTH label, JSON tags, elements, orphans,
 * sets, wiring integrity, and label correctness in one shot.
 */

import { fetchAuditConcept } from '../lib/audit-api.js';
import { fmt, section, table } from '../lib/audit-helpers.js';

export function auditConceptCommand(audit) {
  audit
    .command('concept <name>')
    .description('Comprehensive health check for a single concept')
    .option('--json', 'Output raw JSON')
    .option('--verbose', 'Show element and set details')
    .option('--summary', 'One-line status summary only')
    .action(async (name, opts) => {
      try {
        const res = await fetchAuditConcept(name);
        if (!res.success) {
          console.error('Error:', res.error);
          process.exit(1);
        }

        if (!res.found) {
          console.error(`Concept "${name}" not found.`);
          process.exit(1);
        }

        if (opts.json) {
          console.log(JSON.stringify(res, null, 2));
          return;
        }

        const { status, concept, checks, skeleton, elements, sets, wiring } = res;

        const statusIcon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
        const statusLabel = status === 'pass' ? 'HEALTHY' : status === 'warn' ? 'WARNINGS' : 'ISSUES FOUND';

        if (opts.summary) {
          const issues = checks.filter(c => c.status === 'fail' || c.status === 'warn').map(c => c.summary);
          const brief = issues.length > 0 ? issues.join('; ') : 'Healthy';
          console.log(`${statusIcon} ${concept.name}: ${brief}`);
          return;
        }

        // Banner

        section(`${statusIcon} Concept Audit: "${concept.name}" — ${statusLabel}`);
        console.log(`  UUID:   ${concept.uuid}`);
        console.log(`  Author: ${concept.pubkey ? concept.pubkey.slice(0, 16) + '...' : '(unknown)'}`);
        console.log();

        // Checks summary
        section('Checks');
        const nameWidth = Math.max(...checks.map(c => c.name.length), 6);
        for (const check of checks) {
          const icon = check.status === 'pass' ? '✅'
            : check.status === 'warn' ? '⚠️ '
            : check.status === 'info' ? 'ℹ️ '
            : '❌';
          console.log(`  ${icon} ${check.name.padEnd(nameWidth)}  ${check.summary}`);
        }
        console.log();

        // Skeleton detail
        section('Skeleton Nodes');
        const skRows = skeleton.nodes.map(n => ({
          role: n.role,
          exists: n.exists ? '✅' : '❌',
          json: n.json ? '✅' : '❌',
          name: n.name || '—',
          uuid: n.uuid ? (n.uuid.length > 50 ? n.uuid.slice(0, 47) + '…' : n.uuid) : '—',
        }));
        table(skRows, [
          { key: 'role', label: 'Role' },
          { key: 'exists', label: 'Exists' },
          { key: 'json', label: 'JSON' },
          { key: 'name', label: 'Name' },
          { key: 'uuid', label: 'UUID' },
        ]);

        // Elements summary
        if (elements.total > 0) {
          console.log();
          section(`Elements (${elements.total})`);
          console.log(`  With JSON:    ${fmt(elements.withJson)}`);
          console.log(`  Without JSON: ${fmt(elements.withoutJson)}`);
          if (elements.orphaned > 0) {
            console.log(`  Orphaned:     ${fmt(elements.orphaned)}`);
          }

          if (opts.verbose && elements.items.length > 0) {
            console.log();
            const elemRows = elements.items.map(e => ({
              name: e.name || '(unnamed)',
              json: e.hasJson ? '✅' : '❌',
              orphan: (e.missingZTag || e.brokenZTag) ? '⚠️' : '—',
            }));
            table(elemRows, [
              { key: 'name', label: 'Element' },
              { key: 'json', label: 'JSON' },
              { key: 'orphan', label: 'Orphan' },
            ]);
          }
        }

        // Sets
        if (sets.total > 0) {
          console.log();
          section(`Sets (${sets.total})`);
          if (opts.verbose) {
            const setRows = sets.items.map(s => ({
              name: s.name || '(unnamed)',
              uuid: s.uuid ? (s.uuid.length > 50 ? s.uuid.slice(0, 47) + '…' : s.uuid) : '—',
            }));
            table(setRows, [
              { key: 'name', label: 'Set' },
              { key: 'uuid', label: 'UUID' },
            ]);
          } else {
            console.log(`  ${sets.items.map(s => s.name).join(', ')}`);
          }
        }

        // Wiring violations
        if (wiring.count > 0) {
          console.log();
          section(`Wiring Violations (${wiring.count})`);
          const wirRows = wiring.violations.map(v => ({
            from: v.fromName || '(unnamed)',
            rel: v.relType,
            to: v.toName || '(unnamed)',
            fromLabels: Array.isArray(v.fromLabels) ? v.fromLabels.join(', ') : v.fromLabels,
            toLabels: Array.isArray(v.toLabels) ? v.toLabels.join(', ') : v.toLabels,
          }));
          table(wirRows, [
            { key: 'from', label: 'From' },
            { key: 'rel', label: 'Relationship' },
            { key: 'to', label: 'To' },
            { key: 'fromLabels', label: 'From Labels' },
            { key: 'toLabels', label: 'To Labels' },
          ]);
        }

        console.log();
      } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
