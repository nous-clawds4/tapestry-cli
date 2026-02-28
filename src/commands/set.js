/**
 * tapestry set — create and manage Set nodes in the concept graph
 *
 * A Set is a ListItem whose z-tag points to the canonical "set" concept.
 * Sets provide sub-categorization within a concept's class thread:
 *   Superset → IS_A_SUPERSET_OF → Set → HAS_ELEMENT → ListItem
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { apiGet } from '../lib/api.js';
import { signEvent } from '../lib/signer.js';

const execAsync = promisify(execCb);
const CONTAINER = 'tapestry-tapestry-1';

// Canonical concept UUIDs
const SET_CONCEPT_UUID = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:6a339361-beef-4013-a916-1723e05a4671';
const RELATIONSHIP_CONCEPT_UUID = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:c15357e6-6665-45cc-8ea5-0320b8026f05';

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
 * Find a concept's Superset by concept name.
 * Returns { conceptUuid, supersetUuid, supersetName, concept } or null.
 */
async function findConceptSuperset(name) {
  const rows = await cypher(
    `MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) ` +
    `WHERE toLower(t.value) = toLower('${name.replace(/'/g, "\\'")}') ` +
    `MATCH (h)-[:IS_THE_CONCEPT_FOR]->(s:Superset) ` +
    `OPTIONAL MATCH (s)-[:HAS_TAG]->(n:NostrEventTag {type: 'name'}) ` +
    `RETURN h.uuid AS conceptUuid, s.uuid AS supersetUuid, n.value AS supersetName, t.value AS concept ` +
    `LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Find a Set node by name.
 * Returns { uuid, name } or null.
 */
async function findSet(name) {
  const rows = await cypher(
    `MATCH (s:Set)-[:HAS_TAG]->(n:NostrEventTag {type: 'name'}) ` +
    `WHERE toLower(n.value) = toLower('${name.replace(/'/g, "\\'")}') ` +
    `RETURN s.uuid AS uuid, n.value AS name LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Find a node by name (for set add).
 * Searches ListHeaders (by 'names' tag) first, then ListItems (by 'name' tag).
 * ListHeaders first because concept-as-element is a key use case.
 * Returns { uuid, name } or null.
 */
async function findItem(name) {
  // Try ListHeader first (concept-as-element / CTH cases)
  let rows = await cypher(
    `MATCH (h:ListHeader)-[:HAS_TAG]->(n:NostrEventTag {type: 'names'}) ` +
    `WHERE toLower(n.value) = toLower('${name.replace(/'/g, "\\'")}') ` +
    `RETURN h.uuid AS uuid, n.value AS name LIMIT 1`
  );
  if (rows.length > 0) return rows[0];
  // Fall back to ListItem
  rows = await cypher(
    `MATCH (i:ListItem)-[:HAS_TAG]->(n:NostrEventTag {type: 'name'}) ` +
    `WHERE toLower(n.value) = toLower('${name.replace(/'/g, "\\'")}') ` +
    `RETURN i.uuid AS uuid, n.value AS name LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Import events to strfry and update Neo4j.
 */
async function importEvents(events) {
  // Clean events: only include standard nostr fields (remove _signerLabel etc.)
  const cleanEvents = events.map(e => ({
    id: e.id, pubkey: e.pubkey, created_at: e.created_at,
    kind: e.kind, tags: e.tags, content: e.content, sig: e.sig,
  }));
  const jsonl = cleanEvents.map(e => JSON.stringify(e)).join('\n') + '\n';
  const tmpFile = `/tmp/tapestry_set_${Date.now()}.jsonl`;
  const { writeFileSync, unlinkSync } = await import('fs');
  writeFileSync(tmpFile, jsonl);

  try {
    const { stdout } = await execAsync(
      `docker exec -i ${CONTAINER} strfry import < ${tmpFile} 2>&1`,
      { timeout: 30000 }
    );
    const addedMatch = stdout.match(/(\d+) added/);
    console.log(`  ✅ ${addedMatch ? addedMatch[1] : events.length} event(s) written to strfry`);
  } catch (err) {
    console.error(`  ❌ strfry import failed: ${err.message}`);
    throw err;
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
    throw err;
  }
}

export function setCommand(program) {
  const set = program
    .command('set')
    .description('Create and manage Set nodes (sub-categories within concepts)');

  set
    .command('create <name>')
    .description('Create a new Set node within a concept')
    .requiredOption('--parent <concept>', 'Parent concept name (the Set will be a sub-category of this concept\'s Superset)')
    .option('--d-tag <id>', 'Custom d-tag (default: random 8-char hex)')
    .option('--personal', 'Sign with personal nsec from 1Password')
    .option('--dry-run', 'Show what would be created without doing it')
    .action(async (name, opts) => {
      await createSet(name, opts);
    });

  set
    .command('add <set-name> <item-name>')
    .description('Add an existing item to a Set via HAS_ELEMENT relationship')
    .option('--personal', 'Sign with personal nsec from 1Password')
    .option('--dry-run', 'Show what would be created without doing it')
    .action(async (setName, itemName, opts) => {
      await addToSet(setName, itemName, opts);
    });

  set
    .command('list')
    .description('List all Set nodes in the graph')
    .action(async () => {
      await listSets();
    });
}

async function createSet(name, opts) {
  console.log(`\n📦 Creating Set: "${name}"\n`);

  // Find the parent concept and its Superset
  const parent = await findConceptSuperset(opts.parent);
  if (!parent) {
    console.error(`  ❌ Concept "${opts.parent}" not found or has no Superset node.`);
    console.error(`     Use 'tapestry concept list' to see available concepts.`);
    console.error(`     If the concept exists but lacks a Superset, run 'tapestry normalize fix-supersets' first.`);
    process.exit(1);
  }

  console.log(`  📌 Parent concept: "${parent.concept}" (${parent.conceptUuid})`);
  console.log(`  📌 Parent superset: "${parent.supersetName}" (${parent.supersetUuid})`);

  const dTag = opts.dTag || randomBytes(4).toString('hex');

  if (opts.dryRun) {
    console.log(`\n  🏜️  Dry run — would create:\n`);
    console.log(`     1. Set ListItem (kind 39999):`);
    console.log(`        name: "${name}"`);
    console.log(`        z-tag: ${SET_CONCEPT_UUID}`);
    console.log(`        d-tag: ${dTag}`);
    console.log(`\n     2. IS_A_SUPERSET_OF Relationship (kind 39999):`);
    console.log(`        nodeFrom: ${parent.supersetUuid}`);
    console.log(`        nodeTo: <new set uuid>`);
    console.log(`        relationshipType: IS_A_SUPERSET_OF`);
    console.log('');
    return;
  }

  const events = [];

  // 1. Create the Set ListItem (kind 39999, z-tag → canonical "set" concept)
  console.log('  📝 Creating Set event...');
  const setEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', dTag],
      ['name', name],
      ['z', SET_CONCEPT_UUID],
    ],
    content: '',
  }, { personal: opts.personal });

  events.push(setEvent);
  const setATag = `39999:${setEvent.pubkey}:${dTag}`;
  console.log(`     ✅ Set: ${setEvent.id.slice(0, 12)}... (${setATag})`);

  // 2. Create the IS_A_SUPERSET_OF Relationship connecting parent Superset → new Set
  console.log('  📝 Creating IS_A_SUPERSET_OF relationship...');
  const relDTag = randomBytes(4).toString('hex');
  const relEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', relDTag],
      ['name', `${parent.supersetName} IS_A_SUPERSET_OF ${name}`],
      ['z', RELATIONSHIP_CONCEPT_UUID],
      ['nodeFrom', parent.supersetUuid],
      ['nodeTo', setATag],
      ['relationshipType', 'IS_A_SUPERSET_OF'],
    ],
    content: '',
  }, { personal: opts.personal });

  events.push(relEvent);
  console.log(`     ✅ Relationship: ${relEvent.id.slice(0, 12)}...`);

  // Import to strfry + Neo4j
  console.log('\n  📡 Importing events...');
  await importEvents(events);

  console.log(`\n✨ Set "${name}" created under "${parent.concept}"!`);
  console.log(`\nTo add items: tapestry set add "${name}" "<item name>"`);
  console.log('');
}

async function addToSet(setName, itemName, opts) {
  console.log(`\n📦 Adding "${itemName}" to Set "${setName}"\n`);

  // Find the Set
  const set = await findSet(setName);
  if (!set) {
    console.error(`  ❌ Set "${setName}" not found. Use 'tapestry set list' to see available Sets.`);
    process.exit(1);
  }

  // Find the item
  const item = await findItem(itemName);
  if (!item) {
    console.error(`  ❌ Item "${itemName}" not found in the graph.`);
    process.exit(1);
  }

  console.log(`  📌 Set:  "${set.name}" (${set.uuid})`);
  console.log(`  📌 Item: "${item.name}" (${item.uuid})`);

  // Check if HAS_ELEMENT already exists
  const existing = await cypher(
    `MATCH (s)-[:HAS_ELEMENT]->(i) ` +
    `WHERE s.uuid = '${set.uuid}' AND i.uuid = '${item.uuid}' ` +
    `RETURN count(*) AS cnt`
  );
  if (parseInt(existing[0]?.cnt || '0') > 0) {
    console.log(`\n  ℹ️  "${item.name}" is already an element of "${set.name}". Nothing to do.\n`);
    return;
  }

  if (opts.dryRun) {
    console.log(`\n  🏜️  Dry run — would create:\n`);
    console.log(`     HAS_ELEMENT Relationship (kind 39999):`);
    console.log(`       nodeFrom: ${set.uuid}`);
    console.log(`       nodeTo: ${item.uuid}`);
    console.log(`       relationshipType: HAS_ELEMENT`);
    console.log('');
    return;
  }

  // Create HAS_ELEMENT Relationship
  console.log('  📝 Creating HAS_ELEMENT relationship...');
  const relDTag = randomBytes(4).toString('hex');
  const relEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', relDTag],
      ['name', `${set.name} HAS_ELEMENT ${item.name}`],
      ['z', RELATIONSHIP_CONCEPT_UUID],
      ['nodeFrom', set.uuid],
      ['nodeTo', item.uuid],
      ['relationshipType', 'HAS_ELEMENT'],
    ],
    content: '',
  }, { personal: opts.personal });

  console.log(`     ✅ Relationship: ${relEvent.id.slice(0, 12)}...`);

  // Import to strfry + Neo4j
  console.log('\n  📡 Importing events...');
  await importEvents([relEvent]);

  console.log(`\n✨ "${item.name}" added to Set "${set.name}"!\n`);
}

async function listSets() {
  console.log('\n📦 Sets in the graph:\n');

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
    console.log('  No Set nodes found.\n');
    console.log('  Create one with: tapestry set create "<name>" --parent "<concept>"\n');
    return;
  }

  for (const row of rows) {
    console.log(`  📦 "${row.name}" — ${row.items} item(s)`);
    console.log(`     Parent: ${row.parentSuperset}`);
    console.log(`     UUID:   ${row.uuid}\n`);
  }
}
