/**
 * Create the "identifiers" Set as a subset of "the superset of all properties",
 * then wire identifier property elements into it.
 *
 * Creates new property elements for: uuid, aTag, pubkey, eventId
 * Wires existing elements: name, title, slug, alias
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { writeFileSync, unlinkSync } from 'fs';
import { signEvent } from '../src/lib/signer.js';
import { apiGet } from '../src/lib/api.js';

const execAsync = promisify(execCb);
const CONTAINER = 'tapestry-tapestry-1';

// ─── Constants ───────────────────────────────────────────────
const SUPERSET_CONCEPT_UUID = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:21cbf5be-c972-4f45-ae09-c57e165e8cf9';
const PROPERTY_CONCEPT_UUID = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:6c6a1f9e-6afc-4283-9798-cd2f68c522a7';
const PROPERTY_SUPERSET_UUID = '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:9299f630';
const RELATIONSHIP_CONCEPT_UUID = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:c15357e6-6665-45cc-8ea5-0320b8026f05';

// Existing identifier property elements (by Dave — we'll prefer the Tapestry Assistant versions where they exist)
const EXISTING_IDENTIFIERS = {
  'name': '39999:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:6fae8f5c-f3e9-4eca-baaf-17f4d851aecd',
  'title': '39999:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:804e9f30-c026-406d-815a-1eed5fef6afc',
  'slug': '39999:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:7e113cc1-eab5-4a96-8b15-fa5cafdb3999',
  'alias': '39999:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:cf609d1c-1703-4d6f-b61c-6a3f434d598b',
};

// New identifier properties to create
const NEW_IDENTIFIERS = [
  {
    name: 'uuid',
    type: 'string',
    description: 'The universally unique identifier for the node, typically the a-tag for replaceable events or the event id for non-replaceable events',
  },
  {
    name: 'aTag',
    type: 'string',
    description: 'The addressable tag (kind:pubkey:d-tag) that serves as the stable address for replaceable events',
  },
  {
    name: 'pubkey',
    type: 'string',
    description: 'The hex-encoded public key of the event author',
  },
  {
    name: 'eventId',
    type: 'string',
    description: 'The unique event identifier (SHA-256 hash of the serialized event)',
  },
];

async function main() {
  const events = [];

  // ── Step 1: Create the "identifiers" Set (a Superset node) ──
  console.log('\n🔧 Creating identifier set...\n');

  const setDTag = randomBytes(4).toString('hex');
  const setEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', setDTag],
      ['name', 'the set of all identifiers'],
      ['z', SUPERSET_CONCEPT_UUID],
    ],
    content: 'Properties that serve as identifiers: names, titles, slugs, aliases, UUIDs, a-tags, pubkeys, and event IDs.',
  });
  events.push(setEvent);
  const setUuid = `39999:${setEvent.pubkey}:${setDTag}`;
  console.log(`  ✅ Set: "the set of all identifiers" (${setUuid})`);

  // ── Step 2: Create IS_A_SUPERSET_OF relationship ──
  // "the superset of all properties" → IS_A_SUPERSET_OF → "the set of all identifiers"
  const relDTag = randomBytes(4).toString('hex');
  const relEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', relDTag],
      ['name', 'the superset of all properties IS_A_SUPERSET_OF the set of all identifiers'],
      ['z', RELATIONSHIP_CONCEPT_UUID],
      ['nodeFrom', PROPERTY_SUPERSET_UUID],
      ['nodeTo', setUuid],
      ['relationshipType', 'IS_A_SUPERSET_OF'],
    ],
    content: '',
  });
  events.push(relEvent);
  console.log(`  ✅ Relationship: IS_A_SUPERSET_OF`);

  // ── Step 3: Create new property elements ──
  console.log('\n  Creating new identifier property elements...\n');

  const allIdentifierUuids = [];

  for (const prop of NEW_IDENTIFIERS) {
    const dTag = randomBytes(4).toString('hex');
    const jsonData = JSON.stringify({
      property: {
        name: prop.name,
        type: prop.type,
        description: prop.description,
      }
    });

    const propEvent = await signEvent({
      kind: 39999,
      tags: [
        ['d', dTag],
        ['name', prop.name],
        ['type', prop.type],
        ['description', prop.description],
        ['z', PROPERTY_CONCEPT_UUID],
        ['json', jsonData],
      ],
      content: '',
    });
    events.push(propEvent);
    const propUuid = `39999:${propEvent.pubkey}:${dTag}`;
    allIdentifierUuids.push(propUuid);
    console.log(`  ✅ New property: "${prop.name}" (${propUuid})`);
  }

  // Add existing identifier UUIDs
  for (const [name, uuid] of Object.entries(EXISTING_IDENTIFIERS)) {
    allIdentifierUuids.push(uuid);
    console.log(`  📎 Existing property: "${name}" (${uuid})`);
  }

  // ── Step 4: Import events to strfry ──
  console.log(`\n  📡 Importing ${events.length} events to strfry...`);
  const jsonl = events.map(e => JSON.stringify(e)).join('\n');
  const tmpFile = `/tmp/tapestry_identifiers_${Date.now()}.jsonl`;
  writeFileSync(tmpFile, jsonl);

  try {
    const { stdout } = await execAsync(
      `cat ${tmpFile} | docker exec -i ${CONTAINER} strfry import 2>&1`,
      { timeout: 30000 }
    );
    const addedMatch = stdout.match(/(\d+) added/);
    console.log(`  ✅ ${addedMatch ? addedMatch[1] : events.length} events written to strfry`);
    unlinkSync(tmpFile);
  } catch (err) {
    console.error(`  ❌ strfry import failed: ${err.message}`);
    return;
  }

  // ── Step 5: Update Neo4j ──
  console.log('\n  📊 Updating Neo4j (batch transfer + setup)...');
  try {
    await execAsync(
      `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/batchTransfer.sh`,
      { timeout: 120000 }
    );
    await execAsync(
      `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/setup.sh`,
      { timeout: 60000 }
    );
    console.log('  ✅ Neo4j updated');
  } catch (err) {
    console.error(`  ❌ Neo4j update failed: ${err.message}`);
    return;
  }

  // ── Step 6: Wire HAS_ELEMENT edges in Neo4j ──
  console.log('\n  🔗 Wiring HAS_ELEMENT edges from identifier set to elements...');

  for (const elemUuid of allIdentifierUuids) {
    const q = `MATCH (s {uuid: '${setUuid}'}), (e {uuid: '${elemUuid}'}) ` +
              `WHERE NOT (s)-[:HAS_ELEMENT]->(e) ` +
              `CREATE (s)-[:HAS_ELEMENT]->(e) RETURN 'wired' AS result`;
    const encoded = encodeURIComponent(q);
    const data = await apiGet(`/api/neo4j/run-query?cypher=${encoded}`);
    const name = Object.entries(EXISTING_IDENTIFIERS).find(([_, u]) => u === elemUuid)?.[0] ||
                 NEW_IDENTIFIERS.find(p => allIdentifierUuids.indexOf(elemUuid) - Object.keys(EXISTING_IDENTIFIERS).length === NEW_IDENTIFIERS.indexOf(p))?.name ||
                 elemUuid.split(':').pop();
    console.log(`     ✅ ${elemUuid.split(':').pop().slice(0, 8)}...`);
  }

  console.log('\n✨ Done! Created identifier set with 8 elements.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
