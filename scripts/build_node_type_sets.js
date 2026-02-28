#!/usr/bin/env node

/**
 * Build the Set/Superset hierarchy for the "node type" concept:
 *
 * (node type) -[:IS_THE_CONCEPT_FOR]-> (the superset of all node types)
 *     -[:IS_A_SUPERSET_OF]-> (canonical node types)
 *         -[:HAS_ELEMENT]-> ListHeader, ListItem, Superset, Property, JSONSchema, Relationship, Set
 *     -[:IS_A_SUPERSET_OF]-> (non-canonical node types)
 *         -[:HAS_ELEMENT]-> NostrUser, NostrEvent, NostrEventTag
 */

import { signEvent } from '../src/lib/signer.js';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { writeFileSync, unlinkSync } from 'fs';

const execAsync = promisify(execCb);
const CONTAINER = 'tapestry-tapestry-1';

// Canonical UUIDs from defaults.conf
const SUPERSET_CONCEPT = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:21cbf5be-c972-4f45-ae09-c57e165e8cf9';
const RELATIONSHIP_CONCEPT = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:c15357e6-6665-45cc-8ea5-0320b8026f05';

// Root superset for "node type"
const ROOT_SUPERSET = '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:bc83bc4d';

// Item UUIDs (from the query above)
const CANONICAL_ITEMS = [
  '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:2ccc90c5', // ListHeader
  '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:53483561', // ListItem
  '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:23f953a6', // Superset
  '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:9a924e6b', // Property
  '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:f4edfb53', // JSONSchema
  '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:d4ab2612', // Relationship
  '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:be2c02a3', // Set
];

const NON_CANONICAL_ITEMS = [
  '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:47985a8a', // NostrUser
  '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:7768c635', // NostrEvent
  '39999:2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38:2ef109da', // NostrEventTag
];

const events = [];

function dTag() { return randomBytes(4).toString('hex'); }

async function main() {
  console.log('🧵 Building Set hierarchy for "node type"...\n');

  // 1. Create "canonical node types" sub-superset
  const canonicalDTag = dTag();
  const canonicalSuperset = await signEvent({
    kind: 39999,
    tags: [
      ['d', canonicalDTag],
      ['name', 'canonical node types'],
      ['z', SUPERSET_CONCEPT],
      ['description', 'Node types defined by the tapestry protocol: ListHeader, ListItem, Superset, Property, JSONSchema, Relationship, Set.'],
    ],
    content: '',
  });
  events.push(canonicalSuperset);
  const canonicalUuid = `39999:${canonicalSuperset.pubkey}:${canonicalDTag}`;
  console.log(`  ✅ Created "canonical node types" (${canonicalSuperset.id.slice(0, 12)}...)`);

  // 2. Create "non-canonical node types" sub-superset
  const nonCanonicalDTag = dTag();
  const nonCanonicalSuperset = await signEvent({
    kind: 39999,
    tags: [
      ['d', nonCanonicalDTag],
      ['name', 'non-canonical node types'],
      ['z', SUPERSET_CONCEPT],
      ['description', 'Implementation-specific node types not defined by the tapestry protocol: NostrUser, NostrEvent, NostrEventTag.'],
    ],
    content: '',
  });
  events.push(nonCanonicalSuperset);
  const nonCanonicalUuid = `39999:${nonCanonicalSuperset.pubkey}:${nonCanonicalDTag}`;
  console.log(`  ✅ Created "non-canonical node types" (${nonCanonicalSuperset.id.slice(0, 12)}...)`);

  // 3. IS_A_SUPERSET_OF: root → canonical
  events.push(await signEvent({
    kind: 39999,
    tags: [
      ['d', dTag()],
      ['name', 'the superset of all node types IS_A_SUPERSET_OF canonical node types'],
      ['z', RELATIONSHIP_CONCEPT],
      ['nodeFrom', ROOT_SUPERSET],
      ['nodeTo', canonicalUuid],
      ['relationshipType', 'IS_A_SUPERSET_OF'],
    ],
    content: '',
  }));
  console.log('  ✅ Relationship: root → canonical (IS_A_SUPERSET_OF)');

  // 4. IS_A_SUPERSET_OF: root → non-canonical
  events.push(await signEvent({
    kind: 39999,
    tags: [
      ['d', dTag()],
      ['name', 'the superset of all node types IS_A_SUPERSET_OF non-canonical node types'],
      ['z', RELATIONSHIP_CONCEPT],
      ['nodeFrom', ROOT_SUPERSET],
      ['nodeTo', nonCanonicalUuid],
      ['relationshipType', 'IS_A_SUPERSET_OF'],
    ],
    content: '',
  }));
  console.log('  ✅ Relationship: root → non-canonical (IS_A_SUPERSET_OF)');

  // 5. HAS_ELEMENT: canonical → each canonical item
  for (const itemUuid of CANONICAL_ITEMS) {
    events.push(await signEvent({
      kind: 39999,
      tags: [
        ['d', dTag()],
        ['name', `canonical node types HAS_ELEMENT ${itemUuid.split(':').pop()}`],
        ['z', RELATIONSHIP_CONCEPT],
        ['nodeFrom', canonicalUuid],
        ['nodeTo', itemUuid],
        ['relationshipType', 'HAS_ELEMENT'],
      ],
      content: '',
    }));
  }
  console.log(`  ✅ 7 HAS_ELEMENT relationships: canonical → items`);

  // 6. HAS_ELEMENT: non-canonical → each non-canonical item
  for (const itemUuid of NON_CANONICAL_ITEMS) {
    events.push(await signEvent({
      kind: 39999,
      tags: [
        ['d', dTag()],
        ['name', `non-canonical node types HAS_ELEMENT ${itemUuid.split(':').pop()}`],
        ['z', RELATIONSHIP_CONCEPT],
        ['nodeFrom', nonCanonicalUuid],
        ['nodeTo', itemUuid],
        ['relationshipType', 'HAS_ELEMENT'],
      ],
      content: '',
    }));
  }
  console.log(`  ✅ 3 HAS_ELEMENT relationships: non-canonical → items`);

  // Import all events to strfry
  console.log(`\n  📡 Importing ${events.length} events to strfry...`);
  const tmpFile = `/tmp/node_type_sets_${Date.now()}.jsonl`;
  writeFileSync(tmpFile, events.map(e => JSON.stringify(e)).join('\n'));
  try {
    const { stdout } = await execAsync(
      `cat ${tmpFile} | docker exec -i ${CONTAINER} strfry import 2>&1`,
      { timeout: 30000 }
    );
    const addedMatch = stdout.match(/(\d+) added/);
    console.log(`  ✅ ${addedMatch ? addedMatch[1] : events.length} events written`);
    unlinkSync(tmpFile);
  } catch (err) {
    console.error(`  ❌ ${err.message}`);
    return;
  }

  // Update Neo4j
  console.log('\n  📊 Updating Neo4j...');
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
    console.error(`  ❌ ${err.message}`);
  }

  console.log('\n✨ Set hierarchy for "node type" complete!\n');
  console.log('Structure:');
  console.log('  (node type) → (the superset of all node types)');
  console.log('      → (canonical node types)');
  console.log('          → ListHeader, ListItem, Superset, Property, JSONSchema, Relationship, Set');
  console.log('      → (non-canonical node types)');
  console.log('          → NostrUser, NostrEvent, NostrEventTag\n');
}

main().catch(err => { console.error(err); process.exit(1); });
