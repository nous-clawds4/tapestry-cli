/**
 * tapestry audit stats — Quick summary of the concept graph
 *
 * Calls GET /api/audit/stats and renders the result.
 */

import { fetchAuditStats } from '../lib/audit-api.js';
import { fmt, section, table } from '../lib/audit-helpers.js';

export function auditStatsCommand(audit) {
  audit
    .command('stats')
    .description('Quick summary: node counts, relationship counts, concept counts')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        await runStats(opts);
      } catch (err) {
        console.error(`\n  ❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}

async function runStats(opts) {
  console.log('\n📊 Concept Graph Statistics\n');

  const result = await fetchAuditStats();
  if (!result.success) throw new Error(result.error || 'API call failed');

  const { totals, byLabel, byRelType, concepts, signers, jsonCoverage } = result.data;

  section('Totals');
  console.log(`  Nodes:         ${fmt(totals.nodes)}`);
  console.log(`  Relationships: ${fmt(totals.relationships)}`);

  section('Nodes by Label');
  // Flatten label arrays into individual counts
  const labelCounts = {};
  for (const row of byLabel) {
    const labels = String(row.labels).replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    for (const label of labels) {
      labelCounts[label] = (labelCounts[label] || 0) + parseInt(row.count, 10);
    }
  }
  const labelRows = Object.entries(labelCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count: fmt(count) }));

  table(labelRows, [
    { key: 'label', label: 'Label', width: 30 },
    { key: 'count', label: 'Count', width: 10 },
  ]);

  section('Relationships by Type');
  table(byRelType.map(r => ({ relType: r.relType, count: fmt(r.count) })), [
    { key: 'relType', label: 'Relationship Type', width: 40 },
    { key: 'count', label: 'Count', width: 10 },
  ]);

  section('Concepts');
  table(concepts.map(c => ({
    name: c.concept,
    elements: c.elements,
    superset: String(c.hasSuperset).toLowerCase() === 'true' ? '✅' : '❌',
  })), [
    { key: 'name', label: 'Concept', width: 35 },
    { key: 'elements', label: 'Elements', width: 10 },
    { key: 'superset', label: 'Superset', width: 10 },
  ]);
  console.log(`\n  Total concepts: ${concepts.length}`);

  section('Signers');
  table(signers.map(s => ({ signer: s.signer, count: fmt(s.events) })), [
    { key: 'signer', label: 'Pubkey', width: 22 },
    { key: 'count', label: 'Events', width: 10 },
  ]);

  section('JSON Tag Coverage');
  table(jsonCoverage.map(r => ({
    nodeType: r.nodeType,
    total: r.total,
    withJson: r.withJson,
    missing: r.missing,
  })), [
    { key: 'nodeType', label: 'Node Type', width: 20 },
    { key: 'total', label: 'Total', width: 8 },
    { key: 'withJson', label: 'Has JSON', width: 10 },
    { key: 'missing', label: 'Missing', width: 10 },
  ]);

  if (opts.json) {
    console.log('\n' + JSON.stringify(result, null, 2));
  }

  console.log('');
}
