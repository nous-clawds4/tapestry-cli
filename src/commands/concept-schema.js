/**
 * tapestry concept schema <concept> — show or update the JSON Schema for a concept
 *
 * Thin client: calls server API endpoints.
 *
 * - Show: queries Neo4j for existing schema
 * - Save: calls POST /api/normalize/save-schema
 * - Create missing: calls POST /api/normalize/skeleton
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

export function schemaCommand(concept) {
  concept
    .command('schema <concept-name>')
    .description('Show, create, or update the JSON Schema for a concept')
    .option('--create', 'Create missing JSON Schema node via normalize skeleton')
    .option('--content <json>', 'Save JSON Schema content (valid JSON object)')
    .action(async (conceptName, opts) => {
      await handleSchema(conceptName, opts);
    });
}

async function handleSchema(conceptName, opts) {
  console.log(`\n📋 JSON Schema for concept "${conceptName}"\n`);

  // If --content provided, save the schema via API
  if (opts.content) {
    let schema;
    try {
      schema = JSON.parse(opts.content);
    } catch (err) {
      console.error(`  ❌ Invalid JSON: ${err.message}`);
      process.exit(1);
    }

    const result = await apiPost('/api/normalize/save-schema', {
      concept: conceptName,
      schema,
    });

    if (!result.success) {
      console.error(`  ❌ ${result.error}\n`);
      process.exit(1);
    }

    console.log(`  ✅ ${result.message}`);
    console.log(`  Schema UUID: ${result.schemaUuid}\n`);
    return;
  }

  // If --create, use normalize skeleton to create missing nodes
  if (opts.create) {
    const result = await apiPost('/api/normalize/skeleton', {
      concept: conceptName,
      target: 'schema',
    });

    if (!result.success) {
      console.error(`  ❌ ${result.error}\n`);
      process.exit(1);
    }

    console.log(`  ✅ ${result.message}\n`);
    return;
  }

  // Default: show existing schema
  const esc = conceptName.replace(/'/g, "\\'");
  const rows = await cypher(
    `MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) ` +
    `WHERE toLower(t.value) = toLower('${esc}') ` +
    `OPTIONAL MATCH (s:JSONSchema)-[:IS_THE_JSON_SCHEMA_FOR]->(h) ` +
    `OPTIONAL MATCH (s)-[:HAS_TAG]->(jt:NostrEventTag {type: 'json'}) ` +
    `RETURN h.uuid AS headerUuid, s.uuid AS schemaUuid, jt.value AS schemaJson ` +
    `LIMIT 1`
  );

  if (rows.length === 0) {
    console.error(`  ❌ Concept "${conceptName}" not found.\n`);
    process.exit(1);
  }

  const { schemaUuid, schemaJson } = rows[0];
  if (!schemaUuid) {
    console.log(`  ❌ No JSON Schema node found. Use --create to create one.\n`);
    return;
  }

  console.log(`  UUID: ${schemaUuid}`);
  if (schemaJson) {
    try {
      const parsed = JSON.parse(schemaJson);
      console.log(`  Content:\n${JSON.stringify(parsed, null, 2)}\n`);
    } catch {
      console.log(`  Content (raw): ${schemaJson}\n`);
    }
  } else {
    console.log(`  Content: (empty)\n`);
    console.log(`  Use --content '{"properties":{...}}' to set schema content.\n`);
  }
}
