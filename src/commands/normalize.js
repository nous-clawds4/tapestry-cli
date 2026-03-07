/**
 * tapestry normalize — housekeeping commands for concept graph integrity
 *
 * Check commands are read-only (Cypher queries via API).
 * Fix commands call server API endpoints to create/repair events.
 */

import { apiGet, apiPost } from '../lib/api.js';
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
  console.log('━'.repeat(50));
  console.log('Class Thread Orphans (Rule 3)');
  console.log('Items not reachable via Superset → HAS_ELEMENT\n');

  const wiredUp = await cypher(
    "MATCH (:Superset)-[:HAS_ELEMENT]->(i:ListItem) " +
    "RETURN count(DISTINCT i) AS cnt"
  );
  const wiredCount = parseInt(wiredUp[0]?.cnt || '0');

  const totalElements = await cypher(
    "MATCH (i:ListItem) " +
    "WHERE NOT i:Superset AND NOT i:Property AND NOT i:JSONSchema AND NOT i:Relationship " +
    "RETURN count(i) AS cnt"
  );
  const totalCount = parseInt(totalElements[0]?.cnt || '0');

  console.log(`  Total element ListItems: ${totalCount}`);
  console.log(`  Wired via HAS_ELEMENT:   ${wiredCount}`);
  console.log(`  Missing HAS_ELEMENT:     ${totalCount - wiredCount}\n`);

  const ctOrphans = await cypher(
    "MATCH (i:ListItem)-[:HAS_TAG]->(z:NostrEventTag {type: 'z'}) " +
    "WHERE NOT i:Superset AND NOT i:Property AND NOT i:JSONSchema AND NOT i:Relationship " +
    "AND NOT (:Superset)-[:HAS_ELEMENT]->(i) " +
    "AND EXISTS { MATCH (h) WHERE h.uuid = z.value AND (h:ListHeader OR h:ListItem) } " +
    "WITH z.value AS parentUuid, count(i) AS itemCount " +
    "MATCH (h) WHERE h.uuid = parentUuid AND (h:ListHeader OR h:ListItem) " +
    "OPTIONAL MATCH (h)-[:HAS_TAG]->(t:NostrEventTag) WHERE t.type IN ['names', 'name'] " +
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
      if (row.status === 'inferrable') inferrableTotal += parseInt(row.itemCount);
      else blockedTotal += parseInt(row.itemCount);
    }

    console.log(`\n  Summary:`);
    console.log(`     🔗 Inferrable (Superset exists, HAS_ELEMENT missing): ${inferrableTotal}`);
    console.log(`     🚫 Blocked (parent has no Superset):                  ${blockedTotal}\n`);
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

  // Find concepts missing supersets
  const rows = await cypher(
    "MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) " +
    "WHERE NOT (h)-[:IS_THE_CONCEPT_FOR]->(:Superset) " +
    "RETURN DISTINCT t.value AS concept " +
    "ORDER BY concept"
  );

  if (rows.length === 0) {
    console.log('✅ Nothing to fix — all ListHeaders already have Superset nodes.\n');
    return;
  }

  console.log(`Found ${rows.length} ListHeader(s) needing Superset nodes.\n`);

  if (opts.dryRun) {
    for (const row of rows) {
      console.log(`  📝 Would create skeleton for "${row.concept}"`);
    }
    console.log('');
    return;
  }

  let fixed = 0;
  for (const row of rows) {
    console.log(`  📝 "${row.concept}"...`);
    const result = await apiPost('/api/normalize/skeleton', {
      concept: row.concept,
      node: 'superset',
    });
    if (result.success) {
      console.log(`     ✅ ${result.message}`);
      fixed++;
    } else {
      console.log(`     ❌ ${result.error}`);
    }
  }

  console.log(`\n✨ Fixed ${fixed}/${rows.length} concepts.\n`);
}

// ─── Rule 11: JSON Schema deduplication ──────────────────────

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
    console.log(`     Schemas: ${row.schemas}`);
    console.log('');
  }
  console.log(`Run 'tapestry normalize fix-schemas' to resolve.\n`);
}

async function fixSchemas(opts) {
  console.log('\n🔧 Resolving concepts with multiple JSON Schema nodes (Rule 11)...\n');

  // This function only manipulates Neo4j relationships (no event creation),
  // so it uses Cypher queries directly via the API. No local signing needed.

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

    const schemas = await cypher(
      "MATCH (js:JSONSchema)-[:IS_THE_JSON_SCHEMA_FOR]->(h {uuid: '" + concept.uuid + "'}) " +
      "OPTIONAL MATCH (js)-[:HAS_TAG]->(jn:NostrEventTag {type: 'name'}) " +
      "OPTIONAL MATCH (js)-[:HAS_TAG]->(jt:NostrEventTag {type: 'json'}) " +
      "OPTIONAL MATCH (p:Property)-[:IS_A_PROPERTY_OF]->(js) " +
      "RETURN DISTINCT js.uuid AS uuid, jn.value AS name, js.pubkey AS author, " +
      "  CASE WHEN jt.value IS NOT NULL THEN 'yes' ELSE 'no' END AS hasJson, " +
      "  count(DISTINCT p) AS propCount"
    );

    // Select winner by heuristic
    let winner = schemas.find(s => s.author === PRINCIPAL_PUBKEY && s.hasJson === 'yes')
      || schemas.find(s => s.author === PRINCIPAL_PUBKEY)
      || schemas.find(s => s.hasJson === 'yes')
      || schemas.sort((a, b) => parseInt(b.propCount) - parseInt(a.propCount))[0];

    const losers = schemas.filter(s => s.uuid !== winner.uuid);

    console.log(`     ✅ Keep: "${winner.name}" (json=${winner.hasJson}, ${winner.propCount} props)`);
    for (const loser of losers) {
      console.log(`     ❌ Deprecate: "${loser.name}" (json=${loser.hasJson}, ${loser.propCount} props)`);
    }

    if (opts.dryRun) {
      console.log('     🏜️  Dry run — skipping changes\n');
      continue;
    }

    for (const loser of losers) {
      await cypher("MATCH (js {uuid: '" + loser.uuid + "'})-[r:IS_THE_JSON_SCHEMA_FOR]->(h {uuid: '" + concept.uuid + "'}) DELETE r");
      console.log(`     🔗 Removed IS_THE_JSON_SCHEMA_FOR from "${loser.name}"`);

      const loserProps = await cypher(
        "MATCH (p:Property)-[:IS_A_PROPERTY_OF]->(js {uuid: '" + loser.uuid + "'}) " +
        "OPTIONAL MATCH (p)-[:HAS_TAG]->(pn:NostrEventTag {type: 'name'}) " +
        "RETURN p.uuid AS uuid, pn.value AS name"
      );

      for (const lp of loserProps) {
        const existing = await cypher(
          "MATCH (p:Property)-[:IS_A_PROPERTY_OF]->(js {uuid: '" + winner.uuid + "'}) " +
          "MATCH (p)-[:HAS_TAG]->(pn:NostrEventTag {type: 'name', value: '" + (lp.name || '') + "'}) " +
          "RETURN p.uuid AS uuid"
        );

        await cypher("MATCH (p {uuid: '" + lp.uuid + "'})-[r:IS_A_PROPERTY_OF]->(js {uuid: '" + loser.uuid + "'}) DELETE r");

        if (existing.length > 0) {
          console.log(`     🔗 Removed duplicate property "${lp.name}"`);
        } else {
          await cypher("MATCH (p {uuid: '" + lp.uuid + "'}), (js {uuid: '" + winner.uuid + "'}) CREATE (p)-[:IS_A_PROPERTY_OF]->(js)");
          console.log(`     🔗 Re-wired property "${lp.name}" to winner`);
        }
      }

      const existingSupercedes = await cypher(
        "MATCH (a {uuid: '" + winner.uuid + "'})-[:SUPERCEDES]->(b {uuid: '" + loser.uuid + "'}) RETURN count(*) AS cnt"
      );
      if (parseInt(existingSupercedes[0]?.cnt || '0') === 0) {
        await cypher("MATCH (a {uuid: '" + winner.uuid + "'}), (b {uuid: '" + loser.uuid + "'}) CREATE (a)-[:SUPERCEDES]->(b)");
        console.log(`     🔗 Created SUPERCEDES audit trail`);
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

  console.log('\nRule 1: Every ListHeader must have a Superset');
  const missingSupersets = await cypher(
    "MATCH (h:ListHeader)-[:HAS_TAG]->(:NostrEventTag {type: 'names'}) " +
    "WHERE NOT (h)-[:IS_THE_CONCEPT_FOR]->(:Superset) RETURN count(DISTINCT h) AS cnt"
  );
  const missingCount = parseInt(missingSupersets[0]?.cnt || '0');
  const mislabeled = await cypher(
    "MATCH (h:ListHeader) WHERE NOT (h)-[:HAS_TAG]->(:NostrEventTag {type: 'names'}) RETURN count(h) AS cnt"
  );
  const mislabeledCount = parseInt(mislabeled[0]?.cnt || '0');
  if (missingCount === 0) console.log('  ✅ Pass');
  else console.log(`  ❌ ${missingCount} ListHeader(s) missing Superset nodes`);
  if (mislabeledCount > 0) console.log(`  ℹ️  ${mislabeledCount} ListHeader(s) have no 'names' tag`);

  console.log('\nRule 2: Every ListItem must have a valid parent pointer');
  const orphans = await cypher(
    "MATCH (i:ListItem)-[:HAS_TAG]->(z:NostrEventTag {type: 'z'}) " +
    "WHERE NOT EXISTS { MATCH (h:ListHeader) WHERE h.uuid = z.value } " +
    "RETURN count(DISTINCT i) AS cnt"
  );
  const orphanCount = parseInt(orphans[0]?.cnt || '0');
  if (orphanCount === 0) console.log('  ✅ Pass');
  else console.log(`  ❌ ${orphanCount} ListItem(s) with invalid parent references`);

  console.log('\nRule 7: No duplicate concepts per author');
  const dupes = await cypher(
    "MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) " +
    "WITH h.pubkey AS pubkey, t.value AS name, count(h) AS cnt " +
    "WHERE cnt > 1 RETURN name, pubkey, cnt"
  );
  if (dupes.length === 0) console.log('  ✅ Pass');
  else {
    console.log(`  ❌ ${dupes.length} duplicate concept(s):`);
    for (const d of dupes) console.log(`     "${d.name}" — ${d.cnt}x by ${d.pubkey?.slice(0, 8)}...`);
  }

  console.log('\nRule 11: Every concept must have at most one active JSON Schema');
  const dupSchemas = await cypher(
    "MATCH (js:JSONSchema)-[:IS_THE_JSON_SCHEMA_FOR]->(h) " +
    "WITH h, count(DISTINCT js) AS cnt WHERE cnt > 1 RETURN count(h) AS total"
  );
  const dupSchemaCount = parseInt(dupSchemas[0]?.total || '0');
  if (dupSchemaCount === 0) console.log('  ✅ Pass');
  else console.log(`  ❌ ${dupSchemaCount} concept(s) with multiple JSON Schema nodes`);

  const total = missingCount + orphanCount + dupes.length + dupSchemaCount;
  console.log('\n' + '━'.repeat(50));
  if (total === 0) console.log('✅ Graph is fully normalized!\n');
  else console.log(`⚠️  ${total} issue(s) found. Run specific fix commands to resolve.\n`);
}
