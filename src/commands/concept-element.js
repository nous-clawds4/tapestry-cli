/**
 * tapestry concept element <concept-name> --of <parent-concept>
 *
 * Declares that one concept is an element of another concept (vertical integration).
 * Thin client: resolves names to UUIDs, then calls POST /api/normalize/add-node-as-element
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

/**
 * Find a concept's header UUID by name.
 */
async function findConceptUuid(name) {
  const esc = name.replace(/'/g, "\\'");
  // Try ListHeader first
  let rows = await cypher(
    `MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) ` +
    `WHERE toLower(t.value) = toLower('${esc}') ` +
    `RETURN h.uuid AS uuid, t.value AS name LIMIT 1`
  );
  if (rows.length > 0) return rows[0];
  // Try ListItem functioning as concept
  rows = await cypher(
    `MATCH (h:ListItem)-[:HAS_TAG]->(t:NostrEventTag {type: 'name'}) ` +
    `WHERE toLower(t.value) = toLower('${esc}') ` +
    `RETURN h.uuid AS uuid, t.value AS name LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

export function elementCommand(concept) {
  concept
    .command('element <concept-name>')
    .description('Declare a concept as an element of another concept (vertical integration)')
    .requiredOption('--of <parent-concept>', 'The parent concept this concept is an element of')
    .action(async (conceptName, opts) => {
      try {
        // Resolve names to UUIDs
        const child = await findConceptUuid(conceptName);
        if (!child) {
          console.error(`\n❌ Concept "${conceptName}" not found.\n`);
          process.exit(1);
        }

        const parent = await findConceptUuid(opts.of);
        if (!parent) {
          console.error(`\n❌ Concept "${opts.of}" not found.\n`);
          process.exit(1);
        }

        const result = await apiPost('/api/normalize/add-node-as-element', {
          conceptUuid: parent.uuid,
          nodeUuid: child.uuid,
        });

        if (!result.success) {
          console.error(`\n❌ ${result.error}\n`);
          process.exit(1);
        }

        console.log(`\n✅ ${result.message}`);
        console.log(`  Element: ${result.element.name} (${result.element.uuid})`);
        console.log(`  Parent:  ${result.concept.name} (${result.concept.uuid})\n`);
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
