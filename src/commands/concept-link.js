/**
 * tapestry concept link <parent> --superset-of <child>
 *
 * Creates an IS_A_SUPERSET_OF relationship between two concepts' Superset nodes.
 * Example: tapestry concept link "animals" --superset-of "dogs"
 *   → (the superset of all animals) -[:IS_A_SUPERSET_OF]-> (the superset of all dogs)
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
 * Find a concept's Superset by name.
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

export function linkCommand(concept) {
  concept
    .command('link <parent-concept>')
    .description('Link two concepts: parent IS_A_SUPERSET_OF child')
    .requiredOption('--superset-of <child-concept>', 'The child concept (parent is a superset of this)')
    .option('--personal', 'Sign with personal nsec from 1Password')
    .option('--dry-run', 'Show what would be created without doing it')
    .action(async (parentName, opts) => {
      await linkConcepts(parentName, opts.supersetOf, opts);
    });
}

async function linkConcepts(parentName, childName, opts) {
  console.log(`\n🔗 Linking: "${parentName}" is a superset of "${childName}"\n`);

  // Find parent concept's Superset
  const parent = await findConceptSuperset(parentName);
  if (!parent) {
    console.error(`  ❌ Concept "${parentName}" not found or has no Superset node.`);
    console.error(`     Use 'tapestry concept list' to see available concepts.`);
    console.error(`     If the concept exists but lacks a Superset, run 'tapestry normalize fix-supersets' first.`);
    process.exit(1);
  }

  // Find child concept's Superset
  const child = await findConceptSuperset(childName);
  if (!child) {
    console.error(`  ❌ Concept "${childName}" not found or has no Superset node.`);
    console.error(`     Use 'tapestry concept list' to see available concepts.`);
    console.error(`     If the concept exists but lacks a Superset, run 'tapestry normalize fix-supersets' first.`);
    process.exit(1);
  }

  console.log(`  📌 Parent: "${parent.concept}"`);
  console.log(`     Superset: "${parent.supersetName}" (${parent.supersetUuid})`);
  console.log(`  📌 Child:  "${child.concept}"`);
  console.log(`     Superset: "${child.supersetName}" (${child.supersetUuid})`);

  // Check if relationship already exists
  const existing = await cypher(
    `MATCH (p {uuid: '${parent.supersetUuid}'})-[:IS_A_SUPERSET_OF]->(c {uuid: '${child.supersetUuid}'}) ` +
    `RETURN count(*) AS cnt`
  );
  if (parseInt(existing[0]?.cnt || '0') > 0) {
    console.log(`\n  ℹ️  "${parent.supersetName}" is already linked to "${child.supersetName}". Nothing to do.\n`);
    return;
  }

  if (opts.dryRun) {
    console.log(`\n  🏜️  Dry run — would create:\n`);
    console.log(`     IS_A_SUPERSET_OF Relationship (kind 39999):`);
    console.log(`       nodeFrom: ${parent.supersetUuid}`);
    console.log(`       nodeTo:   ${child.supersetUuid}`);
    console.log(`       name: "${parent.supersetName} IS_A_SUPERSET_OF ${child.supersetName}"`);
    console.log('');
    return;
  }

  // Create the IS_A_SUPERSET_OF Relationship event
  console.log('\n  📝 Creating IS_A_SUPERSET_OF relationship...');
  const relDTag = randomBytes(4).toString('hex');
  const relEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', relDTag],
      ['name', `${parent.supersetName} IS_A_SUPERSET_OF ${child.supersetName}`],
      ['z', uuid('relationship')],
      ['nodeFrom', parent.supersetUuid],
      ['nodeTo', child.supersetUuid],
      ['relationshipType', 'IS_A_SUPERSET_OF'],
    ],
    content: '',
  }, { personal: opts.personal });

  console.log(`     ✅ Signed: ${relEvent.id.slice(0, 12)}... (by ${relEvent._signerLabel || relEvent.pubkey.slice(0, 12)})`);

  // Import to strfry + Neo4j
  console.log('\n  📡 Importing...');
  await importEventsAndSync([relEvent]);

  console.log(`\n✨ Linked: "${parent.concept}" is a superset of "${child.concept}"!`);
  console.log(`   ${parent.supersetName} → IS_A_SUPERSET_OF → ${child.supersetName}\n`);
}
