/**
 * tapestry concept enumerate <enumerating-concept> --property <property-name> --of <target-concept>
 *
 * Creates an ENUMERATES relationship: the enumerating concept's Superset
 * enumerates a Property that belongs to the target concept's JSON schema.
 *
 * Example: tapestry concept enumerate "Dog Breed" --property "breed" --of "dog"
 *   → (the superset of all dog breeds) -[:ENUMERATES]-> (breed: Property)
 *
 * This is horizontal integration: it declares that the elements of one concept
 * provide the valid values for a property of another concept.
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { writeFileSync, unlinkSync } from 'fs';
import { apiGet } from '../lib/api.js';
import { signEvent } from '../lib/signer.js';

const execAsync = promisify(execCb);
const CONTAINER = 'tapestry-tapestry-1';
const RELATIONSHIP_CONCEPT_UUID = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:c15357e6-6665-45cc-8ea5-0320b8026f05';
const PROPERTY_CONCEPT_UUID = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:6c6a1f9e-6afc-4283-9798-cd2f68c522a7';

/**
 * Run a Cypher query and return parsed rows.
 */
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
 * Find a concept's Superset by name.
 */
async function findConceptSuperset(name) {
  const rows = await cypher(
    `MATCH (h)-[:HAS_TAG]->(t:NostrEventTag) ` +
    `WHERE (t.type = 'names' OR t.type = 'name') ` +
    `AND toLower(t.value) = toLower('${name.replace(/'/g, "\\'")}') ` +
    `AND (h:ListHeader OR h:ListItem) ` +
    `MATCH (h)-[:IS_THE_CONCEPT_FOR]->(s:Superset) ` +
    `OPTIONAL MATCH (s)-[:HAS_TAG]->(n:NostrEventTag {type: 'name'}) ` +
    `RETURN h.uuid AS conceptUuid, s.uuid AS supersetUuid, n.value AS supersetName, t.value AS concept ` +
    `LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Find a Property node by name.
 */
async function findProperty(name) {
  const rows = await cypher(
    `MATCH (p:Property)-[:HAS_TAG]->(n:NostrEventTag {type: 'name'}) ` +
    `WHERE toLower(n.value) = toLower('${name.replace(/'/g, "\\'")}') ` +
    `RETURN p.uuid AS uuid, n.value AS name LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Find a JSONSchema node for a concept.
 */
async function findSchema(conceptName) {
  const rows = await cypher(
    `MATCH (h)-[:HAS_TAG]->(t:NostrEventTag) ` +
    `WHERE (t.type = 'names' OR t.type = 'name') ` +
    `AND toLower(t.value) = toLower('${conceptName.replace(/'/g, "\\'")}') ` +
    `MATCH (js:JSONSchema)-[:IS_THE_JSON_SCHEMA_FOR]->(h) ` +
    `OPTIONAL MATCH (js)-[:HAS_TAG]->(n:NostrEventTag {type: 'name'}) ` +
    `RETURN js.uuid AS uuid, n.value AS name LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

export function enumerateCommand(concept) {
  concept
    .command('enumerate <enumerating-concept>')
    .description('Create ENUMERATES relationship (horizontal integration)')
    .requiredOption('--property <property-name>', 'The property being enumerated')
    .requiredOption('--of <target-concept>', 'The concept whose property is being enumerated')
    .option('--property-type <type>', 'JSON type of the property (string, number, boolean, etc.)', 'string')
    .option('--create-property', 'Create the Property node if it doesn\'t exist')
    .option('--personal', 'Sign with personal nsec from 1Password')
    .option('--dry-run', 'Show what would be created without doing it')
    .action(async (enumeratingConcept, opts) => {
      await createEnumerate(enumeratingConcept, opts);
    });
}

async function createEnumerate(enumeratingConceptName, opts) {
  console.log(`\n🔗 Horizontal integration: "${enumeratingConceptName}" enumerates "${opts.property}" of "${opts.of}"\n`);

  // 1. Find the enumerating concept's Superset
  const enumerating = await findConceptSuperset(enumeratingConceptName);
  if (!enumerating) {
    console.error(`  ❌ Concept "${enumeratingConceptName}" not found or has no Superset node.`);
    process.exit(1);
  }
  console.log(`  📌 Enumerating concept: "${enumerating.concept}"`);
  console.log(`     Superset: "${enumerating.supersetName}" (${enumerating.supersetUuid})`);

  // 2. Find or create the Property node
  let property = await findProperty(opts.property);
  if (!property && !opts.createProperty) {
    console.error(`  ❌ Property "${opts.property}" not found. Use --create-property to create it.`);
    process.exit(1);
  }

  const events = [];

  if (!property) {
    console.log(`\n  📝 Creating Property "${opts.property}" (type: ${opts.propertyType})...`);
    if (!opts.dryRun) {
      const dTag = randomBytes(8).toString('hex');
      const propEvent = await signEvent({
        kind: 39999,
        tags: [
          ['d', dTag],
          ['name', opts.property],
          ['type', opts.propertyType],
          ['z', PROPERTY_CONCEPT_UUID],
        ],
        content: '',
      }, { personal: opts.personal });
      const clean = {
        id: propEvent.id, pubkey: propEvent.pubkey, created_at: propEvent.created_at,
        kind: propEvent.kind, tags: propEvent.tags, content: propEvent.content, sig: propEvent.sig,
      };
      events.push(clean);
      property = { uuid: `39999:${propEvent.pubkey}:${dTag}`, name: opts.property };
      console.log(`     ✅ Property: ${propEvent.id.slice(0, 12)}... (${property.uuid})`);
    } else {
      property = { uuid: '<new property uuid>', name: opts.property };
      console.log(`     Would create Property "${opts.property}" (type: ${opts.propertyType})`);
    }
  } else {
    console.log(`  📌 Property: "${property.name}" (${property.uuid})`);
  }

  // 3. Find the target concept's JSON schema (for IS_A_PROPERTY_OF)
  const schema = await findSchema(opts.of);
  if (schema) {
    console.log(`  📌 Schema: "${schema.name}" (${schema.uuid})`);
  } else {
    console.log(`  ℹ️  No JSON schema found for "${opts.of}" — skipping IS_A_PROPERTY_OF`);
  }

  // 4. Check if ENUMERATES already exists
  if (property.uuid !== '<new property uuid>') {
    const existing = await cypher(
      `MATCH (s {uuid: '${enumerating.supersetUuid}'})-[:ENUMERATES]->(p {uuid: '${property.uuid}'}) ` +
      `RETURN count(*) AS cnt`
    );
    if (parseInt(existing[0]?.cnt || '0') > 0) {
      console.log(`\n  ℹ️  ENUMERATES relationship already exists. Nothing to do.\n`);
      return;
    }
  }

  if (opts.dryRun) {
    console.log(`\n  🏜️  Dry run — would create:\n`);
    console.log(`     1. ENUMERATES Relationship (kind 39999):`);
    console.log(`        nodeFrom: ${enumerating.supersetUuid} (${enumerating.supersetName})`);
    console.log(`        nodeTo:   ${property.uuid} (${property.name})`);
    if (schema) {
      console.log(`\n     2. IS_A_PROPERTY_OF Relationship (kind 39999):`);
      console.log(`        nodeFrom: ${property.uuid} (${property.name})`);
      console.log(`        nodeTo:   ${schema.uuid} (${schema.name})`);
    }
    console.log('');
    return;
  }

  // 5. Create ENUMERATES relationship event
  console.log('\n  📝 Creating ENUMERATES relationship...');
  const enumEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', randomBytes(8).toString('hex')],
      ['name', `${enumerating.supersetName} ENUMERATES ${property.name}`],
      ['z', RELATIONSHIP_CONCEPT_UUID],
      ['nodeFrom', enumerating.supersetUuid],
      ['nodeTo', property.uuid],
      ['relationshipType', 'ENUMERATES'],
    ],
    content: '',
  }, { personal: opts.personal });
  events.push({
    id: enumEvent.id, pubkey: enumEvent.pubkey, created_at: enumEvent.created_at,
    kind: enumEvent.kind, tags: enumEvent.tags, content: enumEvent.content, sig: enumEvent.sig,
  });
  console.log(`     ✅ ENUMERATES: ${enumEvent.id.slice(0, 12)}...`);

  // 6. Create IS_A_PROPERTY_OF if schema exists and relationship doesn't
  if (schema) {
    const existingProp = await cypher(
      `MATCH (p {uuid: '${property.uuid}'})-[:IS_A_PROPERTY_OF]->(s {uuid: '${schema.uuid}'}) ` +
      `RETURN count(*) AS cnt`
    );
    if (parseInt(existingProp[0]?.cnt || '0') === 0) {
      console.log('  📝 Creating IS_A_PROPERTY_OF relationship...');
      const propOfEvent = await signEvent({
        kind: 39999,
        tags: [
          ['d', randomBytes(8).toString('hex')],
          ['name', `${property.name} IS_A_PROPERTY_OF ${schema.name}`],
          ['z', RELATIONSHIP_CONCEPT_UUID],
          ['nodeFrom', property.uuid],
          ['nodeTo', schema.uuid],
          ['relationshipType', 'IS_A_PROPERTY_OF'],
        ],
        content: '',
      }, { personal: opts.personal });
      events.push({
        id: propOfEvent.id, pubkey: propOfEvent.pubkey, created_at: propOfEvent.created_at,
        kind: propOfEvent.kind, tags: propOfEvent.tags, content: propOfEvent.content, sig: propOfEvent.sig,
      });
      console.log(`     ✅ IS_A_PROPERTY_OF: ${propOfEvent.id.slice(0, 12)}...`);
    } else {
      console.log(`  ℹ️  IS_A_PROPERTY_OF already exists`);
    }
  }

  // 7. Import all events
  if (events.length > 0) {
    console.log(`\n  📡 Importing ${events.length} event(s) to strfry...`);
    const tmpFile = `/tmp/tapestry_enum_${Date.now()}.jsonl`;
    writeFileSync(tmpFile, events.map(e => JSON.stringify(e)).join('\n') + '\n');
    try {
      const { stdout } = await execAsync(
        `docker exec -i ${CONTAINER} strfry import < ${tmpFile} 2>&1`,
        { timeout: 30000 }
      );
      const addedMatch = stdout.match(/(\d+) added/);
      console.log(`  ✅ ${addedMatch ? addedMatch[1] : events.length} event(s) written to strfry`);
    } catch (err) {
      console.error(`  ❌ strfry import failed: ${err.message}`);
      process.exit(1);
    } finally {
      try { unlinkSync(tmpFile); } catch {}
    }

    // Update Neo4j
    console.log('  📊 Updating Neo4j...');
    try {
      await execAsync(
        `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/batchTransfer.sh`,
        { timeout: 120000 }
      );
      await execAsync(
        `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/setup.sh`,
        { timeout: 60000 }
      );
      console.log('  ✅ Neo4j updated — labels and relationships applied');
    } catch (err) {
      console.error(`  ❌ Neo4j update failed: ${err.message}`);
    }
  }

  console.log(`\n✨ Horizontal integration complete!`);
  console.log(`   ${enumerating.supersetName} → ENUMERATES → ${property.name}`);
  if (schema) {
    console.log(`   ${property.name} → IS_A_PROPERTY_OF → ${schema.name}`);
  }
  console.log('');
}
