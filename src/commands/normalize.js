/**
 * tapestry normalize — housekeeping commands for concept graph integrity
 */

import { randomBytes } from 'crypto';
import { apiGet } from '../lib/api.js';
import { signEvent } from '../lib/signer.js';
import { importEventsAndSync } from '../lib/neo4j.js';
import { uuid } from '../lib/config.js';
import { normalizeSkeletonCommand } from './normalize-skeleton.js';
import { normalizeJsonCommand } from './normalize-json.js';

export function normalizeCommand(program) {
  const normalize = program
    .command('normalize')
    .description('Check and fix concept graph normalization');

  normalizeSkeletonCommand(normalize);
  normalizeJsonCommand(normalize);

  normalize
    .command('check')
    .description('Report all normalization violations')
    .action(async () => {
      await checkAll();
    });

  normalize
    .command('check-supersets')
    .description('Find ListHeaders missing their Superset node')
    .action(async () => {
      await checkSupersets();
    });

  normalize
    .command('check-orphans')
    .description('Find orphaned ListItems (DList orphans + Class Thread orphans)')
    .action(async () => {
      await checkOrphans();
    });

  normalize
    .command('fix-supersets')
    .description('Create missing Superset nodes for ListHeaders')
    .option('--dry-run', 'Show what would be created without doing it')
    .option('--personal', 'Sign with personal nsec from 1Password')
    .action(async (opts) => {
      await fixSupersets(opts);
    });

  normalize
    .command('check-schemas')
    .description('Find concepts with multiple JSON Schema nodes (Rule 11)')
    .action(async () => {
      await checkSchemas();
    });

  normalize
    .command('fix-schemas')
    .description('Resolve concepts with multiple JSON Schema nodes (Rule 11)')
    .option('--dry-run', 'Show what would be changed without doing it')
    .action(async (opts) => {
      await fixSchemas(opts);
    });
}

/**
 * Run a Cypher query and return parsed results.
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
    // Simple CSV parse — handles quoted strings
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

async function checkSupersets() {
  console.log('\n🔍 Checking for ListHeaders missing Superset nodes...\n');

  const rows = await cypher(
    "MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) " +
    "WHERE NOT (h)-[:IS_THE_CONCEPT_FOR]->(:Superset) " +
    "RETURN DISTINCT t.value AS concept, t.value1 AS plural, h.uuid AS aTag, h.pubkey AS pubkey " +
    "ORDER BY concept"
  );

  if (rows.length === 0) {
    console.log('✅ All ListHeaders have Superset nodes. Graph is normalized for Rule 1.\n');
    return;
  }

  console.log(`⚠️  ${rows.length} ListHeader(s) missing Superset nodes:\n`);
  for (const row of rows) {
    const pub = row.pubkey ? row.pubkey.slice(0, 8) + '...' : '?';
    console.log(`  ❌ "${row.concept}" (${row.plural || '?'}) — by ${pub}`);
  }
  console.log(`\nRun 'tapestry normalize fix-supersets' to create the missing nodes.\n`);
}

async function checkOrphans() {
  console.log('\n🔍 Checking for orphaned ListItems...\n');

  // ── DList Orphans (Rule 2) ──
  // ListItems whose z-tag points to a parent that doesn't exist in the database
  console.log('━'.repeat(50));
  console.log('DList Orphans (Rule 2)');
  console.log('Items whose z-tag references a nonexistent parent event\n');

  const dlistOrphans = await cypher(
    "MATCH (i:ListItem)-[:HAS_TAG]->(z:NostrEventTag {type: 'z'}) " +
    "WHERE NOT EXISTS { MATCH (h) WHERE h.uuid = z.value AND (h:ListHeader OR h:ListItem) } " +
    "OPTIONAL MATCH (i)-[:HAS_TAG]->(n:NostrEventTag {type: 'name'}) " +
    "RETURN i.uuid AS uuid, n.value AS name, z.value AS zTag, i.pubkey AS pubkey " +
    "ORDER BY name"
  );

  if (dlistOrphans.length === 0) {
    console.log('  ✅ No DList orphans — all z-tags resolve to existing parents.\n');
  } else {
    console.log(`  ❌ ${dlistOrphans.length} DList orphan(s):\n`);
    for (const row of dlistOrphans) {
      const pub = row.pubkey ? row.pubkey.slice(0, 8) + '...' : '?';
      const name = row.name || '(unnamed)';
      console.log(`     "${name}" — by ${pub}`);
      console.log(`       z-tag: ${row.zTag}`);
      console.log(`       uuid:  ${row.uuid}\n`);
    }
  }

  // ── Class Thread Orphans (Rule 3) ──
  // ListItems with a valid parent, but no HAS_ELEMENT from any Superset
  // Broken into: inferrable (z-tag chain is valid) vs true orphans
  console.log('━'.repeat(50));
  console.log('Class Thread Orphans (Rule 3)');
  console.log('Items not reachable via Superset → HAS_ELEMENT\n');

  // Items that ARE wired up
  const wiredUp = await cypher(
    "MATCH (:Superset)-[:HAS_ELEMENT]->(i:ListItem) " +
    "RETURN count(DISTINCT i) AS cnt"
  );
  const wiredCount = parseInt(wiredUp[0]?.cnt || '0');

  // Element items (exclude structural node types)
  const totalElements = await cypher(
    "MATCH (i:ListItem) " +
    "WHERE NOT i:Superset AND NOT i:Property AND NOT i:JSONSchema AND NOT i:Relationship " +
    "RETURN count(i) AS cnt"
  );
  const totalCount = parseInt(totalElements[0]?.cnt || '0');

  console.log(`  Total element ListItems: ${totalCount}`);
  console.log(`  Wired via HAS_ELEMENT:   ${wiredCount}`);
  console.log(`  Missing HAS_ELEMENT:     ${totalCount - wiredCount}\n`);

  // Break down the Class Thread orphans by concept, showing which are inferrable
  const ctOrphans = await cypher(
    "MATCH (i:ListItem)-[:HAS_TAG]->(z:NostrEventTag {type: 'z'}) " +
    "WHERE NOT i:Superset AND NOT i:Property AND NOT i:JSONSchema AND NOT i:Relationship " +
    "AND NOT (:Superset)-[:HAS_ELEMENT]->(i) " +
    // Only items whose z-tag DOES resolve (DList orphans handled above)
    "AND EXISTS { MATCH (h) WHERE h.uuid = z.value AND (h:ListHeader OR h:ListItem) } " +
    "WITH z.value AS parentUuid, count(i) AS itemCount " +
    // Get the parent's name
    "MATCH (h) WHERE h.uuid = parentUuid AND (h:ListHeader OR h:ListItem) " +
    "OPTIONAL MATCH (h)-[:HAS_TAG]->(t:NostrEventTag) WHERE t.type IN ['names', 'name'] " +
    // Check if parent has a Superset (inferrable = could be wired up)
    "OPTIONAL MATCH (h)-[:IS_THE_CONCEPT_FOR]->(s:Superset) " +
    "RETURN COALESCE(t.value, '(unnamed)') AS concept, parentUuid, itemCount, " +
    "CASE WHEN s IS NOT NULL THEN 'inferrable' ELSE 'blocked' END AS status " +
    "ORDER BY itemCount DESC"
  );

  if (ctOrphans.length === 0 && (totalCount - wiredCount) === 0) {
    console.log('  ✅ All element items are reachable via class threads.\n');
  } else {
    let inferrableTotal = 0;
    let blockedTotal = 0;

    console.log('  By concept:\n');
    for (const row of ctOrphans) {
      const icon = row.status === 'inferrable' ? '🔗' : '🚫';
      const label = row.status === 'inferrable' ? 'inferrable' : 'blocked (no Superset)';
      console.log(`     ${icon} "${row.concept}" — ${row.itemCount} item(s) [${label}]`);

      if (row.status === 'inferrable') {
        inferrableTotal += parseInt(row.itemCount);
      } else {
        blockedTotal += parseInt(row.itemCount);
      }
    }

    console.log(`\n  Summary:`);
    console.log(`     🔗 Inferrable (Superset exists, HAS_ELEMENT missing): ${inferrableTotal}`);
    console.log(`     🚫 Blocked (parent has no Superset):                  ${blockedTotal}`);
    console.log(`\n  Inferrable orphans have a valid z-tag chain and could be wired up`);
    console.log(`  with HAS_ELEMENT relationships, but may be intentionally left`);
    console.log(`  inferred to keep the graph compact.\n`);
  }

  // ── Grand Summary ──
  console.log('━'.repeat(50));
  const grandTotal = dlistOrphans.length + (totalCount - wiredCount);
  console.log(`\n  DList orphans:        ${dlistOrphans.length}`);
  console.log(`  Class Thread orphans: ${totalCount - wiredCount}`);
  console.log(`  Total:                ${grandTotal}\n`);
}

async function fixSupersets(opts) {
  console.log('\n🔧 Fixing missing Superset nodes...\n');

  const rows = await cypher(
    "MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) " +
    "WHERE NOT (h)-[:IS_THE_CONCEPT_FOR]->(:Superset) " +
    "RETURN DISTINCT t.value AS concept, t.value1 AS plural, h.uuid AS aTag, h.pubkey AS pubkey " +
    "ORDER BY concept"
  );

  if (rows.length === 0) {
    console.log('✅ Nothing to fix — all ListHeaders already have Superset nodes.\n');
    return;
  }

  console.log(`Found ${rows.length} ListHeader(s) needing Superset nodes.\n`);

  if (opts.dryRun) {
    console.log('🏜️  Dry run — showing what would be created:\n');
    for (const row of rows) {
      const plural = row.plural || row.concept + 's';
      console.log(`  📝 "${row.concept}" → Superset: "the superset of all ${plural}"`);
      console.log(`     z-tag: ${uuid('superset')}`);
      console.log(`     nodeFrom: <new superset uuid>`);
      console.log(`     nodeTo: ${row.aTag}`);
      console.log('');
    }
    console.log(`Would create ${rows.length} Superset events + ${rows.length} Relationship events.\n`);
    return;
  }

  let created = 0;
  const events = [];

  for (const row of rows) {
    const plural = row.plural || row.concept + 's';
    const supersetName = `the superset of all ${plural}`;
    const dTag = randomBytes(4).toString('hex');

    console.log(`  📝 "${row.concept}" → "${supersetName}"`);

    // Create the Superset ListItem (kind 39999)
    const supersetEvent = await signEvent({
      kind: 39999,
      tags: [
        ['d', dTag],
        ['name', supersetName],
        ['z', uuid('superset')],
      ],
      content: '',
    }, { personal: opts.personal });

    events.push(supersetEvent);

    // Create the IS_THE_CONCEPT_FOR Relationship ListItem (kind 39999)
    // This connects the ListHeader to its new Superset
    const supersetATag = `39999:${supersetEvent.pubkey}:${dTag}`;
    const relDTag = randomBytes(4).toString('hex');

    // The relationship's z-tag points to the canonical "relationship" concept
    // UUID for IS_THE_CONCEPT_FOR relationship type
    const IS_THE_CONCEPT_FOR_UUID = '39999:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:24bc3eb6-fd75-4679-a3d7-d0b1a2a62be8';

    const relEvent = await signEvent({
      kind: 39999,
      tags: [
        ['d', relDTag],
        ['name', `${row.concept} IS_THE_CONCEPT_FOR ${supersetName}`],
        ['z', uuid('relationship')],
        ['nodeFrom', row.aTag],
        ['nodeTo', supersetATag],
        ['relationshipType', 'IS_THE_CONCEPT_FOR'],
      ],
      content: '',
    }, { personal: opts.personal });

    events.push(relEvent);
    created++;
    console.log(`     ✅ Superset: ${supersetEvent.id.slice(0, 12)}...`);
    console.log(`     ✅ Relationship: ${relEvent.id.slice(0, 12)}...`);
  }

  // Import all events into strfry + targeted Neo4j import
  console.log(`\n  📡 Importing ${events.length} events...`);
  try {
    await importEventsAndSync(events);
  } catch (err) {
    console.error(`  ❌ Import failed: ${err.message}`);
    return;
  }

  console.log(`\n✨ Created ${created} Superset nodes with IS_THE_CONCEPT_FOR relationships.\n`);
}

// ─── Rule 11: JSON Schema deduplication ──────────────────────

// Principal author = Tapestry Assistant (default signer from BRAINSTORM_RELAY_NSEC)
const PRINCIPAL_PUBKEY = '2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38';

async function checkSchemas() {
  console.log('\n🔍 Checking for concepts with multiple JSON Schema nodes (Rule 11)...\n');

  const rows = await cypher(
    "MATCH (js:JSONSchema)-[:IS_THE_JSON_SCHEMA_FOR]->(h) " +
    "OPTIONAL MATCH (h)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) " +
    "OPTIONAL MATCH (js)-[:HAS_TAG]->(jn:NostrEventTag {type: 'name'}) " +
    "OPTIONAL MATCH (js)-[:HAS_TAG]->(jt:NostrEventTag {type: 'json'}) " +
    "WITH h, t.value AS conceptName, " +
    "  collect(DISTINCT {uuid: js.uuid, name: jn.value, author: js.pubkey, hasJson: jt.value IS NOT NULL}) AS schemas " +
    "WHERE size(schemas) > 1 " +
    "RETURN h.uuid AS uuid, conceptName, schemas"
  );

  if (rows.length === 0) {
    console.log('✅ All concepts have at most one JSON Schema. Rule 11 is satisfied.\n');
    return;
  }

  console.log(`⚠️  ${rows.length} concept(s) with multiple JSON Schema nodes:\n`);
  for (const row of rows) {
    console.log(`  ❌ "${row.conceptName || '(unnamed)'}"`);
    console.log(`     UUID: ${row.uuid}`);
    // The schemas field comes back as a string from our CSV parser
    console.log(`     Schemas: ${row.schemas}`);
    console.log('');
  }
  console.log(`Run 'tapestry normalize fix-schemas' to resolve.\n`);
}

async function fixSchemas(opts) {
  console.log('\n🔧 Resolving concepts with multiple JSON Schema nodes (Rule 11)...\n');

  // Find concepts with >1 schema
  const concepts = await cypher(
    "MATCH (js:JSONSchema)-[:IS_THE_JSON_SCHEMA_FOR]->(h) " +
    "OPTIONAL MATCH (h)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) " +
    "WITH h, t.value AS conceptName, collect(DISTINCT js.uuid) AS schemaUuids " +
    "WHERE size(schemaUuids) > 1 " +
    "RETURN h.uuid AS uuid, conceptName, schemaUuids"
  );

  if (concepts.length === 0) {
    console.log('✅ Nothing to fix — all concepts have at most one JSON Schema.\n');
    return;
  }

  console.log(`Found ${concepts.length} concept(s) needing schema deduplication.\n`);

  let fixed = 0;

  for (const concept of concepts) {
    console.log(`  📋 "${concept.conceptName || '(unnamed)'}"`);

    // Get details for each schema on this concept
    const schemas = await cypher(
      "MATCH (js:JSONSchema)-[:IS_THE_JSON_SCHEMA_FOR]->(h {uuid: '" + concept.uuid + "'}) " +
      "OPTIONAL MATCH (js)-[:HAS_TAG]->(jn:NostrEventTag {type: 'name'}) " +
      "OPTIONAL MATCH (js)-[:HAS_TAG]->(jt:NostrEventTag {type: 'json'}) " +
      "OPTIONAL MATCH (p:Property)-[:IS_A_PROPERTY_OF]->(js) " +
      "RETURN DISTINCT js.uuid AS uuid, jn.value AS name, js.pubkey AS author, " +
      "  CASE WHEN jt.value IS NOT NULL THEN 'yes' ELSE 'no' END AS hasJson, " +
      "  count(DISTINCT p) AS propCount"
    );

    // Select the winner using the heuristic:
    // 1. Principal author match
    // 2. Content over empty
    // 3. Most properties
    let winner = null;
    const losers = [];

    // Priority 1: principal author with content
    winner = schemas.find(s => s.author === PRINCIPAL_PUBKEY && s.hasJson === 'yes');
    // Priority 2: principal author (even without content)
    if (!winner) winner = schemas.find(s => s.author === PRINCIPAL_PUBKEY);
    // Priority 3: any schema with content
    if (!winner) winner = schemas.find(s => s.hasJson === 'yes');
    // Priority 4: most properties
    if (!winner) {
      schemas.sort((a, b) => parseInt(b.propCount) - parseInt(a.propCount));
      winner = schemas[0];
    }

    for (const s of schemas) {
      if (s.uuid !== winner.uuid) losers.push(s);
    }

    console.log(`     ✅ Keep: "${winner.name}" (${winner.author === PRINCIPAL_PUBKEY ? 'principal' : winner.author?.slice(0, 8) + '...'}, json=${winner.hasJson}, ${winner.propCount} props)`);
    for (const loser of losers) {
      console.log(`     ❌ Deprecate: "${loser.name}" (${loser.author?.slice(0, 8) + '...'}, json=${loser.hasJson}, ${loser.propCount} props)`);
    }

    if (opts.dryRun) {
      console.log('     🏜️  Dry run — skipping changes\n');
      continue;
    }

    // For each loser: remove IS_THE_JSON_SCHEMA_FOR, re-wire or remove properties, add SUPERCEDES
    for (const loser of losers) {
      // 1. Remove IS_THE_JSON_SCHEMA_FOR
      await cypher(
        "MATCH (js {uuid: '" + loser.uuid + "'})-[r:IS_THE_JSON_SCHEMA_FOR]->(h {uuid: '" + concept.uuid + "'}) DELETE r"
      );
      console.log(`     🔗 Removed IS_THE_JSON_SCHEMA_FOR from "${loser.name}"`);

      // 2. Re-wire properties: if same name exists on winner, just remove; otherwise re-wire
      const loserProps = await cypher(
        "MATCH (p:Property)-[:IS_A_PROPERTY_OF]->(js {uuid: '" + loser.uuid + "'}) " +
        "OPTIONAL MATCH (p)-[:HAS_TAG]->(pn:NostrEventTag {type: 'name'}) " +
        "RETURN p.uuid AS uuid, pn.value AS name"
      );

      for (const lp of loserProps) {
        // Check if winner already has a property with this name
        const existing = await cypher(
          "MATCH (p:Property)-[:IS_A_PROPERTY_OF]->(js {uuid: '" + winner.uuid + "'}) " +
          "MATCH (p)-[:HAS_TAG]->(pn:NostrEventTag {type: 'name', value: '" + (lp.name || '') + "'}) " +
          "RETURN p.uuid AS uuid"
        );

        // Remove edge from loser schema
        await cypher(
          "MATCH (p {uuid: '" + lp.uuid + "'})-[r:IS_A_PROPERTY_OF]->(js {uuid: '" + loser.uuid + "'}) DELETE r"
        );

        if (existing.length > 0) {
          console.log(`     🔗 Removed duplicate IS_A_PROPERTY_OF for "${lp.name}" (already on winner)`);
        } else {
          // Re-wire to winner
          await cypher(
            "MATCH (p {uuid: '" + lp.uuid + "'}), (js {uuid: '" + winner.uuid + "'}) " +
            "CREATE (p)-[:IS_A_PROPERTY_OF]->(js)"
          );
          console.log(`     🔗 Re-wired IS_A_PROPERTY_OF for "${lp.name}" to winner schema`);
        }
      }

      // 3. Create SUPERCEDES relationship
      // Check if it already exists
      const existingSupercedes = await cypher(
        "MATCH (a {uuid: '" + winner.uuid + "'})-[:SUPERCEDES]->(b {uuid: '" + loser.uuid + "'}) RETURN count(*) AS cnt"
      );
      if (parseInt(existingSupercedes[0]?.cnt || '0') === 0) {
        await cypher(
          "MATCH (a {uuid: '" + winner.uuid + "'}), (b {uuid: '" + loser.uuid + "'}) " +
          "CREATE (a)-[:SUPERCEDES]->(b)"
        );
        console.log(`     🔗 Created SUPERCEDES: "${winner.name}" → "${loser.name}"`);
      } else {
        console.log(`     ℹ️  SUPERCEDES already exists`);
      }
    }

    fixed++;
    console.log('');
  }

  console.log(`✨ Resolved ${fixed} concept(s) with duplicate schemas.\n`);
}

/** Exported for use by sync command */
export async function runNormalizeCheck() {
  return checkAll();
}

async function checkAll() {
  console.log('\n🔍 Tapestry Normalization Check\n');
  console.log('━'.repeat(50));

  // Rule 1: Missing supersets (only count real concepts — those with a 'names' tag)
  console.log('\nRule 1: Every ListHeader must have a Superset');
  const missingSupersets = await cypher(
    "MATCH (h:ListHeader)-[:HAS_TAG]->(:NostrEventTag {type: 'names'}) " +
    "WHERE NOT (h)-[:IS_THE_CONCEPT_FOR]->(:Superset) RETURN count(DISTINCT h) AS cnt"
  );
  const missingCount = parseInt(missingSupersets[0]?.cnt || '0');

  // Also count mislabeled ListHeaders (no 'names' tag — likely protocol data, not concepts)
  const mislabeled = await cypher(
    "MATCH (h:ListHeader) WHERE NOT (h)-[:HAS_TAG]->(:NostrEventTag {type: 'names'}) RETURN count(h) AS cnt"
  );
  const mislabeledCount = parseInt(mislabeled[0]?.cnt || '0');
  if (missingCount === 0) {
    console.log('  ✅ Pass');
  } else {
    console.log(`  ❌ ${missingCount} ListHeader(s) missing Superset nodes`);
  }
  if (mislabeledCount > 0) {
    console.log(`  ℹ️  ${mislabeledCount} ListHeader node(s) have no 'names' tag (likely non-concept protocol data)`);
  }

  // Rule 2: Orphaned items
  console.log('\nRule 2: Every ListItem must have a valid parent pointer');
  const orphans = await cypher(
    "MATCH (i:ListItem)-[:HAS_TAG]->(z:NostrEventTag {type: 'z'}) " +
    "WHERE NOT EXISTS { MATCH (h:ListHeader) WHERE h.uuid = z.value } " +
    "RETURN count(DISTINCT i) AS cnt"
  );
  const orphanCount = parseInt(orphans[0]?.cnt || '0');
  if (orphanCount === 0) {
    console.log('  ✅ Pass');
  } else {
    console.log(`  ❌ ${orphanCount} ListItem(s) with invalid parent references`);
  }

  // Rule 7: Duplicate concepts (same author, same name)
  console.log('\nRule 7: No duplicate concepts per author');
  const dupes = await cypher(
    "MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) " +
    "WITH h.pubkey AS pubkey, t.value AS name, count(h) AS cnt " +
    "WHERE cnt > 1 " +
    "RETURN name, pubkey, cnt"
  );
  if (dupes.length === 0) {
    console.log('  ✅ Pass');
  } else {
    console.log(`  ❌ ${dupes.length} duplicate concept(s):`);
    for (const d of dupes) {
      console.log(`     "${d.name}" — ${d.cnt}x by ${d.pubkey?.slice(0, 8)}...`);
    }
  }

  // Rule 11: Duplicate JSON Schemas
  console.log('\nRule 11: Every concept must have at most one active JSON Schema');
  const dupSchemas = await cypher(
    "MATCH (js:JSONSchema)-[:IS_THE_JSON_SCHEMA_FOR]->(h) " +
    "WITH h, count(DISTINCT js) AS cnt " +
    "WHERE cnt > 1 " +
    "RETURN count(h) AS total"
  );
  const dupSchemaCount = parseInt(dupSchemas[0]?.total || '0');
  if (dupSchemaCount === 0) {
    console.log('  ✅ Pass');
  } else {
    console.log(`  ❌ ${dupSchemaCount} concept(s) with multiple JSON Schema nodes`);
  }

  // Summary
  const total = missingCount + orphanCount + dupes.length + dupSchemaCount;
  console.log('\n' + '━'.repeat(50));
  if (total === 0) {
    console.log('✅ Graph is fully normalized!\n');
  } else {
    console.log(`⚠️  ${total} issue(s) found. Run specific fix commands to resolve.\n`);
  }
}
