/**
 * tapestry concept element <concept-name> --of <parent-concept>
 *
 * Declares that one concept is an element of another concept.
 * Creates a HAS_ELEMENT relationship from the parent concept's Superset
 * to the child concept's ListHeader (or ListItem functioning as a concept).
 *
 * Example: tapestry concept element "Irish Setter" --of "Dog Breed"
 *   → (the superset of all dog breeds) -[:HAS_ELEMENT]-> (Irish Setter: ListHeader)
 *
 * This is the second form of vertical integration: a concept that is
 * simultaneously an element of another concept.
 */

import { randomBytes } from 'crypto';
import { apiGet } from '../lib/api.js';
import { signEvent } from '../lib/signer.js';
import { importEventsAndSync } from '../lib/neo4j.js';
import { uuid } from '../lib/config.js';

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
 * Find a concept node by name. Returns { uuid, concept, labels } or null.
 * Searches both ListHeaders (by 'names' tag) and ListItems functioning as concepts (by 'name' tag).
 */
async function findConcept(name) {
  // Try ListHeader first (canonical)
  let rows = await cypher(
    `MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) ` +
    `WHERE toLower(t.value) = toLower('${name.replace(/'/g, "\\'")}') ` +
    `RETURN h.uuid AS uuid, t.value AS concept, labels(h) AS labels LIMIT 1`
  );
  if (rows.length > 0) return rows[0];

  // Fall back to ListItem functioning as concept (kind unification)
  rows = await cypher(
    `MATCH (h:ListItem)-[:HAS_TAG]->(t:NostrEventTag {type: 'name'}) ` +
    `WHERE toLower(t.value) = toLower('${name.replace(/'/g, "\\'")}') ` +
    `AND EXISTS { MATCH (h)-[:IS_THE_CONCEPT_FOR]->(:Superset) } ` +
    `RETURN h.uuid AS uuid, t.value AS concept, labels(h) AS labels LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
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

export function elementCommand(concept) {
  concept
    .command('element <concept-name>')
    .description('Declare a concept as an element of another concept (vertical integration)')
    .requiredOption('--of <parent-concept>', 'The parent concept this concept is an element of')
    .option('--personal', 'Sign with personal nsec from 1Password')
    .option('--dry-run', 'Show what would be created without doing it')
    .action(async (conceptName, opts) => {
      await makeElement(conceptName, opts.of, opts);
    });
}

async function makeElement(childName, parentName, opts) {
  console.log(`\n🔗 Declaring "${childName}" as an element of "${parentName}"\n`);

  // Find the child concept (the one becoming an element)
  const child = await findConcept(childName);
  if (!child) {
    console.error(`  ❌ Concept "${childName}" not found.`);
    console.error(`     Use 'tapestry concept list' to see available concepts.`);
    process.exit(1);
  }

  // Find the parent concept's Superset (which will gain the HAS_ELEMENT)
  const parent = await findConceptSuperset(parentName);
  if (!parent) {
    console.error(`  ❌ Concept "${parentName}" not found or has no Superset node.`);
    console.error(`     Use 'tapestry concept list' to see available concepts.`);
    console.error(`     If the concept exists but lacks a Superset, run 'tapestry normalize fix-supersets' first.`);
    process.exit(1);
  }

  console.log(`  📌 Element: "${child.concept}" (${child.uuid})`);
  console.log(`     Labels:  ${child.labels}`);
  console.log(`  📌 Parent:  "${parent.concept}"`);
  console.log(`     Superset: "${parent.supersetName}" (${parent.supersetUuid})`);

  // Check if HAS_ELEMENT already exists
  const existing = await cypher(
    `MATCH (s {uuid: '${parent.supersetUuid}'})-[:HAS_ELEMENT]->(c {uuid: '${child.uuid}'}) ` +
    `RETURN count(*) AS cnt`
  );
  if (parseInt(existing[0]?.cnt || '0') > 0) {
    console.log(`\n  ℹ️  "${child.concept}" is already an element of "${parent.concept}". Nothing to do.\n`);
    return;
  }

  if (opts.dryRun) {
    console.log(`\n  🏜️  Dry run — would create:\n`);
    console.log(`     HAS_ELEMENT Relationship (kind 39999):`);
    console.log(`       nodeFrom: ${parent.supersetUuid} (${parent.supersetName})`);
    console.log(`       nodeTo:   ${child.uuid} (${child.concept})`);
    console.log(`       name: "${parent.supersetName} HAS_ELEMENT ${child.concept}"`);
    console.log('');
    return;
  }

  // Create the HAS_ELEMENT Relationship event
  console.log('\n  📝 Creating HAS_ELEMENT relationship...');
  const relDTag = randomBytes(4).toString('hex');
  const relEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', relDTag],
      ['name', `${parent.supersetName} HAS_ELEMENT ${child.concept}`],
      ['z', uuid('relationship')],
      ['nodeFrom', parent.supersetUuid],
      ['nodeTo', child.uuid],
      ['relationshipType', 'HAS_ELEMENT'],
    ],
    content: '',
  }, { personal: opts.personal });

  console.log(`     ✅ Signed: ${relEvent.id.slice(0, 12)}... (by ${relEvent._signerLabel || relEvent.pubkey.slice(0, 12)})`);

  // Import to strfry + Neo4j
  console.log('\n  📡 Importing...');
  await importEventsAndSync([relEvent]);

  console.log(`\n✨ "${child.concept}" is now an element of "${parent.concept}"!`);
  console.log(`   ${parent.supersetName} → HAS_ELEMENT → ${child.concept}\n`);
}
