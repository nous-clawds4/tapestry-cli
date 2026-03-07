/**
 * tapestry concept slug <concept> [slug-value] — show or set the slug
 *
 * Thin client: show via Cypher query, set via POST /api/normalize/set-slug
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

function toCamelCase(name) {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export function slugCommand(concept) {
  concept
    .command('slug <concept-name> [slug-value]')
    .description('Show or set the slug for a concept (used as JSON namespace key)')
    .action(async (conceptName, slugValue) => {
      try {
        if (slugValue) {
          // Set the slug via API
          const result = await apiPost('/api/normalize/set-slug', {
            concept: conceptName,
            slug: slugValue,
          });
          if (!result.success) {
            console.error(`\n❌ ${result.error}\n`);
            process.exit(1);
          }
          console.log(`\n✅ ${result.message}\n`);
        } else {
          // Show current slug
          const esc = conceptName.replace(/'/g, "\\'");
          const rows = await cypher(
            `MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) ` +
            `WHERE toLower(t.value) = toLower('${esc}') ` +
            `OPTIONAL MATCH (h)-[:HAS_TAG]->(s:NostrEventTag {type: 'slug'}) ` +
            `RETURN t.value AS name, s.value AS slug LIMIT 1`
          );
          if (rows.length === 0) {
            console.error(`\n❌ Concept "${conceptName}" not found.\n`);
            process.exit(1);
          }
          if (rows[0].slug) {
            console.log(`\n🏷️  "${rows[0].name}" slug: ${rows[0].slug}\n`);
          } else {
            const suggested = toCamelCase(rows[0].name);
            console.log(`\n🏷️  "${rows[0].name}" has no slug.`);
            console.log(`💡 Suggested: ${suggested}`);
            console.log(`\nTo set it: tapestry concept slug "${rows[0].name}" ${suggested}\n`);
          }
        }
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
