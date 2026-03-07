/**
 * tapestry set — create and manage Set nodes
 *
 * Thin client: calls server API endpoints.
 */

import { apiGet, apiPost } from '../lib/api.js';

async function cypher(query) {
  const encoded = encodeURIComponent(query);
  const data = await apiGet(`/api/neo4j/run-query?cypher=${encoded}`);
  if (!data.success) throw new Error(data.error || 'Query failed');
  const raw = (data.cypherResults || '').trim();
  if (!raw) return [];
  const lines = raw.split('\n');
  const header = lines[0].split(', ').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { values.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    values.push(current.trim());
    const row = {};
    header.forEach((h, i) => { row[h] = values[i] || null; });
    return row;
  });
}

export function setCommand(program) {
  const set = program
    .command('set')
    .description('Create and manage Set nodes (sub-categories within concepts)');

  set
    .command('create <name>')
    .description('Create a new Set node within a concept')
    .requiredOption('--parent <concept>', 'Parent concept name')
    .action(async (name, opts) => {
      try {
        const result = await apiPost('/api/normalize/create-set', {
          name,
          parent: opts.parent,
        });
        if (!result.success) {
          console.error(`\n❌ ${result.error}\n`);
          process.exit(1);
        }
        console.log(`\n✅ ${result.message}`);
        console.log(`  UUID: ${result.set.uuid}\n`);
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });

  set
    .command('add <set-name> <item-name>')
    .description('Add an existing item to a Set via HAS_ELEMENT relationship')
    .action(async (setName, itemName) => {
      try {
        const result = await apiPost('/api/normalize/add-to-set', {
          setName,
          itemName,
        });
        if (!result.success) {
          console.error(`\n❌ ${result.error}\n`);
          process.exit(1);
        }
        console.log(`\n✅ ${result.message}\n`);
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });

  set
    .command('list')
    .description('List all Set nodes in the graph')
    .action(async () => {
      const rows = await cypher(
        `MATCH (s:Set)-[:HAS_TAG]->(n:NostrEventTag {type: 'name'}) ` +
        `OPTIONAL MATCH (s)-[:HAS_ELEMENT]->(i:ListItem) ` +
        `OPTIONAL MATCH (parent:Superset)-[:IS_A_SUPERSET_OF]->(s) ` +
        `OPTIONAL MATCH (parent)-[:HAS_TAG]->(pn:NostrEventTag {type: 'name'}) ` +
        `RETURN n.value AS name, s.uuid AS uuid, count(DISTINCT i) AS items, ` +
        `COALESCE(pn.value, '(unknown)') AS parentSuperset ` +
        `ORDER BY name`
      );

      if (rows.length === 0) {
        console.log('\n  No Set nodes found.\n');
        return;
      }

      console.log(`\n📦 Sets (${rows.length}):\n`);
      for (const row of rows) {
        console.log(`  📦 "${row.name}" — ${row.items} item(s)`);
        console.log(`     Parent: ${row.parentSuperset}`);
        console.log(`     UUID:   ${row.uuid}\n`);
      }
    });
}
