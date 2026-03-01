/**
 * tapestry concept schema <concept> — create or show the JSON Schema for a concept
 *
 * Creates a JSONSchema node (kind 39999, z → canonical "JSON schema" concept)
 * and wires it to the concept's Class Thread Header via IS_THE_JSON_SCHEMA_FOR.
 *
 * Usage:
 *   tapestry concept schema dog              # show or create schema for "dog"
 *   tapestry concept schema dog --create     # create schema node + wiring
 *   tapestry concept schema dog --content '{"type":"object","properties":{"breed":{"type":"string"}}}'
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { writeFileSync, unlinkSync } from 'fs';
import { apiGet } from '../lib/api.js';
import { signEvent } from '../lib/signer.js';

const execAsync = promisify(execCb);
const CONTAINER = 'tapestry-tapestry-1';
const JSON_SCHEMA_CONCEPT_UUID = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:bba896cc-c190-4e26-a26f-66d678d4ac89';
const RELATIONSHIP_CONCEPT_UUID = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:c15357e6-6665-45cc-8ea5-0320b8026f05';

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
 * Find a concept (ListHeader or ListItem functioning as concept) by name.
 */
async function findConcept(name) {
  const esc = name.replace(/'/g, "\\'");
  // Try ListHeader first (names tag)
  let rows = await cypher(
    `MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) ` +
    `WHERE toLower(t.value) = toLower('${esc}') ` +
    `RETURN DISTINCT h.uuid AS uuid, t.value AS name LIMIT 1`
  );
  if (rows.length > 0) return rows[0];
  // Try ListItem (name tag)
  rows = await cypher(
    `MATCH (h:ListItem)-[:HAS_TAG]->(t:NostrEventTag {type: 'name'}) ` +
    `WHERE toLower(t.value) = toLower('${esc}') ` +
    `RETURN DISTINCT h.uuid AS uuid, t.value AS name LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Find existing JSON Schema node wired to a concept.
 */
async function findExistingSchema(conceptUuid) {
  const rows = await cypher(
    `MATCH (s:JSONSchema)-[:IS_THE_JSON_SCHEMA_FOR]->(c {uuid: '${conceptUuid}'}) ` +
    `RETURN s.uuid AS uuid, s.kind AS kind LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Find unwired JSON Schema nodes that name-match a concept.
 */
async function findUnwiredSchema(conceptName) {
  const esc = conceptName.replace(/'/g, "\\'");
  // Search by stem (drop trailing 'y', 'ies', 's' etc.) to handle plural/singular mismatches
  const lower = conceptName.toLowerCase().replace(/'/g, "\\'");
  const stem = lower.replace(/(ies|es|s|y)$/, '');
  const rows = await cypher(
    `MATCH (s:JSONSchema)-[:HAS_TAG]->(t:NostrEventTag {type: 'name'}) ` +
    `WHERE toLower(t.value) CONTAINS '${stem}' ` +
    `AND NOT (s)-[:IS_THE_JSON_SCHEMA_FOR]->() ` +
    `RETURN s.uuid AS uuid, t.value AS name LIMIT 5`
  );
  return rows;
}

function cleanEvent(event) {
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
    sig: event.sig,
  };
}

async function importEvents(events) {
  const tmpFile = `/tmp/tapestry_schema_${Date.now()}.jsonl`;
  writeFileSync(tmpFile, events.map(e => JSON.stringify(cleanEvent(e))).join('\n') + '\n');
  try {
    const { stdout } = await execAsync(
      `docker exec -i ${CONTAINER} strfry import < ${tmpFile} 2>&1`,
      { timeout: 30000 }
    );
    const m = stdout.match(/(\d+) added/);
    console.log(`  ✅ ${m ? m[1] : events.length} event(s) written to strfry`);
  } catch (err) {
    console.error(`  ❌ strfry import failed: ${err.message}`);
    throw err;
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

async function updateNeo4j() {
  console.log('  📊 Updating Neo4j...');
  await execAsync(
    `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/batchTransfer.sh`,
    { timeout: 120000 }
  );
  await execAsync(
    `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/setup.sh`,
    { timeout: 60000 }
  );
  console.log('  ✅ Neo4j updated — labels and relationships applied');
}

export function schemaCommand(concept) {
  concept
    .command('schema <concept-name>')
    .description('Show, create, or wire the JSON Schema for a concept')
    .option('--create', 'Create a new JSON Schema node and wire it')
    .option('--replace', 'Replace existing schema with a new one (creates new node + wiring)')
    .option('--wire', 'Wire an existing unwired JSON Schema to the concept')
    .option('--content <json>', 'JSON Schema content (valid JSON object)')
    .option('--personal', 'Sign with personal nsec from 1Password')
    .option('--dry-run', 'Show what would be created without doing it')
    .action(async (conceptName, opts) => {
      await handleSchema(conceptName, opts);
    });
}

async function handleSchema(conceptName, opts) {
  console.log(`\n📋 JSON Schema for concept "${conceptName}"\n`);

  // Find the concept
  const concept = await findConcept(conceptName);
  if (!concept) {
    console.error(`  ❌ Concept "${conceptName}" not found.`);
    process.exit(1);
  }
  console.log(`  📌 Concept: "${concept.name}" (${concept.uuid})`);

  // Check for existing wired schema
  const existing = await findExistingSchema(concept.uuid);
  if (existing && !opts.replace) {
    console.log(`  ✅ Schema already wired: ${existing.uuid}`);
    if (!opts.create && !opts.wire) {
      // Show schema details
      const details = await cypher(
        `MATCH (s {uuid: '${existing.uuid}'})-[:HAS_TAG]->(t:NostrEventTag) ` +
        `RETURN t.type AS tag, t.value AS v1, t.value1 AS v2 ORDER BY t.type`
      );
      console.log('\n  Tags:');
      for (const d of details) {
        console.log(`    ${d.tag}: ${d.v1}${d.v2 ? ' ' + d.v2 : ''}`);
      }
      console.log('\n  Use --replace --content \'...\' to replace with a new schema.');
    }
    console.log('');
    return;
  }

  if (existing && opts.replace) {
    console.log(`  ⚠️  Replacing existing schema: ${existing.uuid}`);
    await createAndWireSchema(concept.uuid, concept.name, conceptName, opts);
    return;
  }

  // No wired schema — check for unwired candidates
  const unwired = await findUnwiredSchema(conceptName);
  if (unwired.length > 0 && !opts.create) {
    console.log(`\n  ⚠️  Found ${unwired.length} unwired JSON Schema node(s) that may match:`);
    for (const u of unwired) {
      console.log(`     • "${u.name}" (${u.uuid})`);
    }
    if (opts.wire) {
      // Wire the first match
      await wireSchema(unwired[0].uuid, concept.uuid, concept.name, opts);
      return;
    }
    console.log(`\n  Use --wire to wire the first match, or --create to create a new one.\n`);
    return;
  }

  if (!opts.create && !opts.wire) {
    console.log(`  ❌ No JSON Schema found for "${conceptName}".`);
    console.log(`     Use --create to create one.\n`);
    return;
  }

  if (opts.create) {
    await createAndWireSchema(concept.uuid, concept.name, conceptName, opts);
  }
}

async function createAndWireSchema(conceptUuid, conceptDisplayName, conceptSearchName, opts) {
  const schemaName = `JSON schema for ${conceptSearchName}`;
  const slug = `JSON_schema_for_${conceptSearchName.replace(/\s+/g, '_')}`;
  const dTag = randomBytes(4).toString('hex');

  // Validate content if provided
  let content = '';
  if (opts.content) {
    try {
      JSON.parse(opts.content);
      content = opts.content;
    } catch (err) {
      console.error(`  ❌ Invalid JSON in --content: ${err.message}`);
      process.exit(1);
    }
  }

  if (opts.dryRun) {
    console.log(`\n  🏜️  Dry run — would create:\n`);
    console.log(`     1. JSONSchema node (kind 39999):`);
    console.log(`        name: "${schemaName}"`);
    console.log(`        z-tag: ${JSON_SCHEMA_CONCEPT_UUID}`);
    console.log(`        content: ${content || '(empty)'}`);
    console.log(`     2. IS_THE_JSON_SCHEMA_FOR Relationship (kind 39999):`);
    console.log(`        nodeFrom: <schema uuid>`);
    console.log(`        nodeTo:   ${conceptUuid}`);
    console.log('');
    return;
  }

  // 1. Create the JSON Schema node
  console.log('\n  📝 Creating JSON Schema node...');
  const tags = [
    ['d', dTag],
    ['name', schemaName],
    ['slug', slug],
    ['title', schemaName.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')],
    ['z', JSON_SCHEMA_CONCEPT_UUID],
  ];
  if (content) {
    tags.push(['json', content]);
  }
  const schemaEvent = await signEvent({
    kind: 39999,
    tags,
    content: '',
  }, { personal: opts.personal });

  const schemaUuid = `39999:${schemaEvent.pubkey}:${dTag}`;
  console.log(`  ✅ Signed: ${schemaEvent.id.slice(0, 12)}... (by ${schemaEvent._signerLabel || schemaEvent.pubkey.slice(0, 12)})`);
  console.log(`     UUID: ${schemaUuid}`);

  // 2. Create the IS_THE_JSON_SCHEMA_FOR Relationship
  console.log('  📝 Creating IS_THE_JSON_SCHEMA_FOR relationship...');
  const relDTag = randomBytes(4).toString('hex');
  const relEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', relDTag],
      ['name', `${schemaName} IS_THE_JSON_SCHEMA_FOR ${conceptDisplayName}`],
      ['z', RELATIONSHIP_CONCEPT_UUID],
      ['nodeFrom', schemaUuid],
      ['nodeTo', conceptUuid],
      ['relationshipType', 'IS_THE_JSON_SCHEMA_FOR'],
    ],
    content: '',
  }, { personal: opts.personal });

  console.log(`  ✅ Signed: ${relEvent.id.slice(0, 12)}... (by ${relEvent._signerLabel || relEvent.pubkey.slice(0, 12)})`);

  // Import both events
  console.log('\n  📡 Importing to strfry...');
  await importEvents([schemaEvent, relEvent]);

  // Update Neo4j
  await updateNeo4j();

  console.log(`\n✨ JSON Schema created and wired for "${conceptDisplayName}"!`);
  console.log(`   ${schemaUuid} → IS_THE_JSON_SCHEMA_FOR → ${conceptUuid}\n`);
}

async function wireSchema(schemaUuid, conceptUuid, conceptName, opts) {
  console.log(`\n  🔗 Wiring existing schema to concept...`);

  if (opts.dryRun) {
    console.log(`\n  🏜️  Dry run — would create:`);
    console.log(`     IS_THE_JSON_SCHEMA_FOR Relationship (kind 39999):`);
    console.log(`       nodeFrom: ${schemaUuid}`);
    console.log(`       nodeTo:   ${conceptUuid}`);
    console.log('');
    return;
  }

  const relDTag = randomBytes(4).toString('hex');
  const relEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', relDTag],
      ['name', `schema IS_THE_JSON_SCHEMA_FOR ${conceptName}`],
      ['z', RELATIONSHIP_CONCEPT_UUID],
      ['nodeFrom', schemaUuid],
      ['nodeTo', conceptUuid],
      ['relationshipType', 'IS_THE_JSON_SCHEMA_FOR'],
    ],
    content: '',
  }, { personal: opts.personal });

  console.log(`  ✅ Signed: ${relEvent.id.slice(0, 12)}...`);

  console.log('\n  📡 Importing to strfry...');
  await importEvents([relEvent]);

  await updateNeo4j();

  console.log(`\n✨ Wired: ${schemaUuid} → IS_THE_JSON_SCHEMA_FOR → ${conceptUuid}\n`);
}
