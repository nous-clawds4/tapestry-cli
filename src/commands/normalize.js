/**
 * tapestry normalize — housekeeping commands for concept graph integrity
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { apiGet } from '../lib/api.js';
import { signEvent } from '../lib/signer.js';

const execAsync = promisify(execCb);
const CONTAINER = 'tapestry-tapestry-1';

// Canonical "superset" ListHeader UUID from defaults.conf
const SUPERSET_CONCEPT_ATAG = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:21cbf5be-c972-4f45-ae09-c57e165e8cf9';

export function normalizeCommand(program) {
  const normalize = program
    .command('normalize')
    .description('Check and fix concept graph normalization');

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
      console.log(`     z-tag: ${SUPERSET_CONCEPT_ATAG}`);
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
        ['z', SUPERSET_CONCEPT_ATAG],
      ],
      content: '',
    }, { personal: opts.personal });

    events.push(supersetEvent);

    // Create the IS_THE_CONCEPT_FOR Relationship ListItem (kind 39999)
    // This connects the ListHeader to its new Superset
    const supersetATag = `39999:${supersetEvent.pubkey}:${dTag}`;
    const relDTag = randomBytes(4).toString('hex');

    // The relationship's z-tag points to the canonical "relationship" concept
    const RELATIONSHIP_CONCEPT_ATAG = '39998:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:c15357e6-6665-45cc-8ea5-0320b8026f05';
    // UUID for IS_THE_CONCEPT_FOR relationship type
    const IS_THE_CONCEPT_FOR_UUID = '39999:e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f:24bc3eb6-fd75-4679-a3d7-d0b1a2a62be8';

    const relEvent = await signEvent({
      kind: 39999,
      tags: [
        ['d', relDTag],
        ['name', `${row.concept} IS_THE_CONCEPT_FOR ${supersetName}`],
        ['z', RELATIONSHIP_CONCEPT_ATAG],
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

  // Import all events into strfry
  console.log(`\n  📡 Importing ${events.length} events to strfry...`);
  const jsonl = events.map(e => JSON.stringify(e)).join('\n');
  try {
    // Write to a temp file and pipe it
    const tmpFile = `/tmp/tapestry_normalize_${Date.now()}.jsonl`;
    const { writeFileSync } = await import('fs');
    writeFileSync(tmpFile, jsonl);
    const { stdout } = await execAsync(
      `cat ${tmpFile} | docker exec -i ${CONTAINER} strfry import 2>&1`,
      { timeout: 30000 }
    );
    const addedMatch = stdout.match(/(\d+) added/);
    console.log(`  ✅ ${addedMatch ? addedMatch[1] : events.length} events written to strfry`);
    // Clean up
    const { unlinkSync } = await import('fs');
    unlinkSync(tmpFile);
  } catch (err) {
    console.error(`  ❌ strfry import failed: ${err.message}`);
    return;
  }

  // Run batch transfer + setup to update Neo4j
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
    console.error(`  ❌ Neo4j update failed: ${err.message}`);
  }

  console.log(`\n✨ Created ${created} Superset nodes with IS_THE_CONCEPT_FOR relationships.\n`);
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

  // Summary
  const total = missingCount + orphanCount + dupes.length;
  console.log('\n' + '━'.repeat(50));
  if (total === 0) {
    console.log('✅ Graph is fully normalized!\n');
  } else {
    console.log(`⚠️  ${total} issue(s) found. Run specific fix commands to resolve.\n`);
  }
}
