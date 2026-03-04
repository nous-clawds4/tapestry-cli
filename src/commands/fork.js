/**
 * tapestry fork <node-name> — fork another author's node into your own graph
 *
 * Creates a copy of the node signed by the Tapestry Assistant (or --personal),
 * swaps all relationships from the original to the fork, and creates a
 * PROVIDED_THE_TEMPLATE_FOR relationship from original → fork.
 *
 * Usage:
 *   tapestry fork "breed"                    # fork the "breed" property
 *   tapestry fork "breed" --edit-tag name=dogBreed  # fork and rename
 *   tapestry fork "breed" --edit-content '...'      # fork and set content
 *   tapestry fork "breed" --add-tag json='{"type":"string"}'  # fork and add tag
 *   tapestry fork "breed" --dry-run
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { apiGet } from '../lib/api.js';
import { signEvent } from '../lib/signer.js';
import { importEventsAndSync } from '../lib/neo4j.js';

const execAsync = promisify(execCb);
import { getConfig, uuid } from '../lib/config.js';

// Relationship types that should NOT be swapped during a fork
const DEFAULT_EXCLUDED_RELS = ['AUTHORS', 'PROVIDED_THE_TEMPLATE_FOR', 'HAS_TAG'];

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
 * Find a node by name — searches across ListHeaders (names tag) and ListItems (name tag).
 * Returns { uuid, name, kind, pubkey } or null.
 */
async function findNode(name) {
  const esc = name.replace(/'/g, "\\'");
  // Try ListHeader first
  let rows = await cypher(
    `MATCH (n:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) ` +
    `WHERE toLower(t.value) = toLower('${esc}') ` +
    `RETURN n.uuid AS uuid, t.value AS name, n.kind AS kind, n.pubkey AS pubkey LIMIT 1`
  );
  if (rows.length > 0) return rows[0];
  // Try ListItem (name tag)
  rows = await cypher(
    `MATCH (n:ListItem)-[:HAS_TAG]->(t:NostrEventTag {type: 'name'}) ` +
    `WHERE toLower(t.value) = toLower('${esc}') ` +
    `RETURN n.uuid AS uuid, t.value AS name, n.kind AS kind, n.pubkey AS pubkey LIMIT 1`
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Find all Relationship events that reference a node UUID (as nodeFrom or nodeTo).
 */
async function findRelationships(uuid) {
  const esc = uuid.replace(/'/g, "\\'");
  const rows = await cypher(
    `MATCH (r:Relationship)-[:HAS_TAG]->(nf:NostrEventTag {type: 'nodeFrom'}), ` +
    `(r)-[:HAS_TAG]->(nt:NostrEventTag {type: 'nodeTo'}), ` +
    `(r)-[:HAS_TAG]->(rt:NostrEventTag {type: 'relationshipType'}) ` +
    `WHERE nf.value = '${esc}' OR nt.value = '${esc}' ` +
    `OPTIONAL MATCH (r)-[:HAS_TAG]->(rn:NostrEventTag {type: 'name'}) ` +
    `RETURN DISTINCT r.uuid AS uuid, r.pubkey AS pubkey, nf.value AS nodeFrom, nt.value AS nodeTo, ` +
    `rt.value AS relType, rn.value AS name`
  );
  return rows;
}

async function importEvents(events) {
  if (events.length === 0) return;
  await importEventsAndSync(events);
}

/**
 * Get original event from strfry by UUID.
 */
async function getOriginalEvent(uuid) {
  const parts = uuid.split(':');
  const kind = parseInt(parts[0]);
  let filter;
  if (kind >= 30000) {
    // Replaceable — use kind + #d
    const dTag = parts.slice(2).join(':');
    const pubkey = parts[1];
    filter = JSON.stringify({ kinds: [kind], authors: [pubkey], '#d': [dTag] });
  } else {
    // Non-replaceable — uuid IS the event id
    filter = JSON.stringify({ ids: [uuid] });
  }
  const escapedFilter = filter.replace(/'/g, "'\\''");
  const { stdout } = await execAsync(
    `docker exec ${getConfig('docker.container')} strfry scan '${escapedFilter}' 2>/dev/null`,
    { timeout: 15000 }
  );
  const lines = stdout.trim().split('\n').filter(Boolean);
  if (lines.length === 0) throw new Error(`Event not found in strfry for UUID: ${uuid}`);
  return JSON.parse(lines[lines.length - 1]);
}

export function forkCommand(program) {
  program
    .command('fork <node-name>')
    .description('Fork another author\'s node — copy, swap relationships, link provenance')
    .option('--edit-tag <key=value...>', 'Edit a tag value (repeatable)', collect, [])
    .option('--add-tag <key=value...>', 'Add a new tag (repeatable)', collect, [])
    .option('--remove-tag <key...>', 'Remove a tag by type (repeatable)', collect, [])
    .option('--edit-content <text>', 'Set the content field on the fork')
    .option('--keep-rel <type...>', 'Additional relationship types to exclude from swapping (repeatable)', collect, [])
    .option('--personal', 'Sign with personal nsec from 1Password')
    .option('--dry-run', 'Show what would be created without doing it')
    .action(async (nodeName, opts) => {
      await forkNode(nodeName, opts);
    });
}

function collect(value, previous) {
  return previous.concat([value]);
}

async function forkNode(nodeName, opts) {
  console.log(`\n🍴 Forking node "${nodeName}"\n`);

  // 1. Find the node
  const node = await findNode(nodeName);
  if (!node) {
    console.error(`  ❌ Node "${nodeName}" not found.`);
    process.exit(1);
  }

  console.log(`  📌 Original: "${node.name}" (${node.uuid})`);
  console.log(`     Author:   ${node.pubkey?.slice(0, 16)}...`);

  // 2. Get original event from strfry
  let origEvent;
  try {
    origEvent = await getOriginalEvent(node.uuid);
  } catch (err) {
    console.error(`  ❌ ${err.message}`);
    process.exit(1);
  }

  // 3. Build forked event — same kind 39999, new d-tag, same tags (with edits)
  const newDTag = randomBytes(4).toString('hex');
  let newTags = origEvent.tags.map(t => [...t]); // deep copy

  // Replace d-tag
  const dIdx = newTags.findIndex(t => t[0] === 'd');
  if (dIdx >= 0) newTags[dIdx] = ['d', newDTag];
  else newTags.unshift(['d', newDTag]);

  // Apply --edit-tag
  for (const edit of (opts.editTag || [])) {
    const eq = edit.indexOf('=');
    if (eq < 0) { console.error(`  ❌ --edit-tag format: key=value`); process.exit(1); }
    const key = edit.slice(0, eq);
    const val = edit.slice(eq + 1);
    const idx = newTags.findIndex(t => t[0] === key);
    if (idx >= 0) {
      newTags[idx][1] = val;
    } else {
      newTags.push([key, val]);
    }
  }

  // Apply --add-tag
  for (const add of (opts.addTag || [])) {
    const eq = add.indexOf('=');
    if (eq < 0) { console.error(`  ❌ --add-tag format: key=value`); process.exit(1); }
    const key = add.slice(0, eq);
    const val = add.slice(eq + 1);
    newTags.push([key, val]);
  }

  // Apply --remove-tag
  for (const key of (opts.removeTag || [])) {
    newTags = newTags.filter(t => t[0] !== key);
  }

  const newContent = opts.editContent !== undefined ? opts.editContent : origEvent.content;

  // 4. Find relationships involving the original node (excluding intrinsic ones)
  const excludedRels = [...DEFAULT_EXCLUDED_RELS, ...(opts.keepRel || [])];
  const allRels = await findRelationships(node.uuid);
  const rels = allRels.filter(r => !excludedRels.includes(r.relType));
  const skipped = allRels.length - rels.length;
  console.log(`\n  🔗 Found ${rels.length} relationship(s) to swap${skipped > 0 ? ` (${skipped} excluded: ${excludedRels.join(', ')})` : ''}:`);
  for (const r of rels) {
    const dir = r.nodeFrom === node.uuid ? '→' : '←';
    const other = r.nodeFrom === node.uuid ? r.nodeTo : r.nodeFrom;
    console.log(`     ${dir} ${r.relType} (${other?.slice(0, 30)}...)`);
  }

  if (opts.dryRun) {
    console.log(`\n  🏜️  Dry run — would create:\n`);
    console.log(`     1. Forked node (kind ${origEvent.kind}):`);
    console.log(`        d-tag: ${newDTag}`);
    for (const t of newTags) {
      if (t[0] !== 'd') console.log(`        ${t[0]}: ${t[1]?.slice(0, 60)}`);
    }
    console.log(`     2. ${rels.length} replacement relationship event(s)`);
    console.log(`     3. PROVIDED_THE_TEMPLATE_FOR relationship`);
    console.log('');
    return;
  }

  // 5. Sign the forked node
  console.log('\n  📝 Creating forked node...');
  const forkedEvent = await signEvent({
    kind: origEvent.kind,
    tags: newTags,
    content: newContent,
  }, { personal: opts.personal });

  const forkedUuid = `${forkedEvent.kind}:${forkedEvent.pubkey}:${newDTag}`;
  console.log(`  ✅ Signed: ${forkedEvent.id.slice(0, 12)}... (by ${forkedEvent._signerLabel || forkedEvent.pubkey.slice(0, 12)})`);
  console.log(`     UUID: ${forkedUuid}`);

  const allEvents = [forkedEvent];

  // 6. Create replacement relationship events
  console.log(`\n  📝 Creating ${rels.length} replacement relationship(s)...`);
  for (const r of rels) {
    const newFrom = r.nodeFrom === node.uuid ? forkedUuid : r.nodeFrom;
    const newTo = r.nodeTo === node.uuid ? forkedUuid : r.nodeTo;
    const relDTag = randomBytes(4).toString('hex');

    // Build a name for the new relationship
    const relName = (r.name || '').replace(node.uuid, forkedUuid);

    const relEvent = await signEvent({
      kind: 39999,
      tags: [
        ['d', relDTag],
        ['name', relName || `${newFrom} ${r.relType} ${newTo}`],
        ['z', uuid('relationship')],
        ['nodeFrom', newFrom],
        ['nodeTo', newTo],
        ['relationshipType', r.relType],
      ],
      content: '',
    }, { personal: opts.personal });

    console.log(`     ✅ ${r.relType}: ${newFrom.slice(-8)} → ${newTo.slice(-8)}`);
    allEvents.push(relEvent);
  }

  // 7. Create PROVIDED_THE_TEMPLATE_FOR relationship
  console.log('\n  📝 Creating PROVIDED_THE_TEMPLATE_FOR provenance link...');
  const provDTag = randomBytes(4).toString('hex');
  const provEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', provDTag],
      ['name', `${node.name} PROVIDED_THE_TEMPLATE_FOR ${nodeName} (fork)`],
      ['z', uuid('relationship')],
      ['nodeFrom', node.uuid],
      ['nodeTo', forkedUuid],
      ['relationshipType', 'PROVIDED_THE_TEMPLATE_FOR'],
    ],
    content: '',
  }, { personal: opts.personal });
  allEvents.push(provEvent);
  console.log(`  ✅ Provenance link created`);

  // 8. Import all events
  console.log(`\n  📡 Importing ${allEvents.length} events...`);
  await importEvents(allEvents);

  console.log(`\n✨ Forked "${node.name}" → "${forkedUuid}"`);
  console.log(`   Original retained with PROVIDED_THE_TEMPLATE_FOR → fork`);
  console.log(`   ${rels.length} relationship(s) swapped to fork\n`);
}
