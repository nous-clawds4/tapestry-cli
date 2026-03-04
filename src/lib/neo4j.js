/**
 * Neo4j utilities for tapestry-cli
 *
 * Provides both targeted single-event import and full resync.
 * Targeted import replicates what batchTransfer.sh + setup.sh do,
 * but only for the specific events provided — no full re-scan.
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { createInterface } from 'readline';
import { createHash } from 'crypto';
import { apiGet, apiPost } from './api.js';
import { getLabelMap, getConfig } from './config.js';

const execAsync = promisify(execCb);

/**
 * Generate a deterministic UUID for a tag node.
 * Takes a hash of the full tag array (e.g. ["p", "abc123"]) scoped to the
 * event's UUID (not the event id), so that when a replaceable event is updated
 * (new id, same uuid/a-tag), its tag nodes merge in place rather than creating
 * duplicates.
 *
 * For non-replaceable events, uuid === event id, so behavior is unchanged.
 *
 * @param {string} eventUuid - The event's uuid (a-tag for replaceable, id for non-replaceable)
 * @param {Array} tag - The full tag array, e.g. ["p", "pubkey", "relay"]
 * @param {number} index - Tag index within the event (disambiguates truly identical tags)
 * @returns {string} Deterministic tag UUID
 */
function tagHash(eventUuid, tag, index) {
  const input = JSON.stringify([eventUuid, tag, index]);
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

// Label map and canonical UUIDs are loaded from config.js at call time
// (not module load time) so that user overrides take effect.

// Relationship types that importToNeo4j knows how to wire from explicit events
const KNOWN_REL_TYPES = [
  'IS_THE_CONCEPT_FOR', 'IS_A_SUPERSET_OF', 'HAS_ELEMENT',
  'IS_A_PROPERTY_OF', 'IS_THE_JSON_SCHEMA_FOR', 'ENUMERATES',
  'PROVIDED_THE_TEMPLATE_FOR', 'IMPORT', 'SUPERCEDES',
  'IS_THE_CLASS_THREADS_GRAPH_FOR', 'IS_THE_PROPERTY_TREE_GRAPH_FOR', 'IS_THE_CORE_GRAPH_FOR',
];

/**
 * Run a Cypher query via the API.
 */
async function cypher(query) {
  // Collapse to single line
  const oneLine = query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const data = await apiPost('/api/neo4j/query', { cypher: oneLine });
  if (!data.success) throw new Error(data.error || 'Query failed');
  return data;
}

/**
 * Run multiple Cypher statements via stdin pipe to cypher-shell.
 * Each statement must end with `;`. Much faster than individual API calls
 * for bulk operations, and avoids shell quoting issues.
 */
async function cypherBatch(statements) {
  const { writeFileSync, unlinkSync } = await import('fs');
  const tmpFile = `/tmp/cypher_batch_${Date.now()}.cypher`;
  const content = statements.map(s => s.trim().replace(/;*$/, '') + ';').join('\n');
  writeFileSync(tmpFile, content + '\n');
  try {
    const { stdout } = await execAsync(
      `docker exec -i ${getConfig('docker.container')} cypher-shell -u ${getConfig('neo4j.user')} -p '${getConfig('neo4j.password')}' < ${tmpFile}`,
      { timeout: 60000 }
    );
    return { success: true, cypherResults: stdout.trim() };
  } catch (err) {
    throw new Error(`cypher-shell batch: ${err.message}`);
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

/**
 * Prompt user for confirmation. Returns true if confirmed.
 */
function confirm(message) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Import specific nostr events into Neo4j using targeted Cypher queries.
 * This replicates what batchTransfer.sh + setup.sh do, but ONLY for the
 * provided events — no full re-scan of strfry.
 *
 * For each event, this function:
 *   1. Creates/merges the NostrEvent node with kind labels and special labels
 *   2. Creates/merges the NostrUser node and AUTHORS relationship
 *   3. Creates/merges all tag nodes (NostrEventTag) with HAS_TAG relationships
 *   4. Wires explicit relationships (nodeFrom/nodeTo/relationshipType tags)
 *   5. Wires IS_THE_CONCEPT_FOR when importing a Superset node (Action 1)
 *   6. Wires implicit HAS_ELEMENT from parent concept's Superset (Action 2)
 *   7. Creates REFERENCES relationships for e/p/a tags (Action 7)
 *
 * @param {Array} events - Array of signed nostr event objects
 * @param {Object} opts - Options
 * @param {boolean} opts.quiet - Suppress output
 */
export async function importToNeo4j(events, opts = {}) {
  const log = opts.quiet ? () => {} : console.log;

  // Collect all Cypher statements, then run in a single batch via stdin pipe
  const statements = [];

  for (const event of events) {
    const clean = {
      id: event.id,
      pubkey: event.pubkey,
      created_at: event.created_at,
      kind: event.kind,
      tags: event.tags,
      content: event.content,
      sig: event.sig,
    };

    const kindLabel = (clean.kind === 9998 || clean.kind === 39998) ? 'ListHeader' : 'ListItem';
    const isReplaceable = clean.kind >= 30000;
    const dTag = clean.tags.find(t => t[0] === 'd')?.[1];
    const uuid = isReplaceable ? `${clean.kind}:${clean.pubkey}:${dTag}` : clean.id;
    const aTag = isReplaceable ? `${clean.kind}:${clean.pubkey}:${dTag}` : null;

    // --- Statement 1: Create/merge event node with user + labels ---
    const parts = [];

    if (isReplaceable) {
      parts.push(
        `MERGE (e:NostrEvent {uuid: '${esc(uuid)}'})`,
        `SET e.id = '${clean.id}', e.pubkey = '${clean.pubkey}', e.created_at = ${clean.created_at}, e.kind = ${clean.kind}, e.aTag = '${esc(aTag)}'`,
        `SET e:${kindLabel}`,
      );
    } else {
      parts.push(
        `MERGE (e:NostrEvent {id: '${clean.id}'})`,
        `SET e.pubkey = '${clean.pubkey}', e.created_at = ${clean.created_at}, e.kind = ${clean.kind}, e.uuid = '${uuid}'`,
        `SET e:${kindLabel}`,
      );
    }

    // Extract name into node property (priority: name > names > title > alias > slug)
    const bestName = clean.tags.find(t => t[0] === 'name')?.[1]
      || clean.tags.find(t => t[0] === 'names')?.[1]
      || clean.tags.find(t => t[0] === 'title')?.[1]
      || clean.tags.find(t => t[0] === 'alias')?.[1]
      || clean.tags.find(t => t[0] === 'slug')?.[1];
    if (bestName) parts.push(`SET e.name = '${esc(bestName)}'`);
    const slugTag = clean.tags.find(t => t[0] === 'slug')?.[1];
    if (slugTag) parts.push(`SET e.slug = '${esc(slugTag)}'`);

    // Special label from z-tag
    const zTag = clean.tags.find(t => t[0] === 'z')?.[1];
    const specialLabel = zTag ? getLabelMap()[zTag] : null;
    if (specialLabel) parts.push(`SET e:${specialLabel}`);

    // User + AUTHORS
    parts.push(
      `WITH e`,
      `MERGE (u:NostrUser {pubkey: '${clean.pubkey}'})`,
      `MERGE (u)-[:AUTHORS]->(e)`,
    );

    statements.push(parts.join(' '));

    // --- Statement 2: Tags ---
    // Tag UUIDs use a hash of [eventId, fullTagArray, index] to handle
    // multiple tags of the same type (e.g. two "p" tags) without collision.
    const tagParts = [];
    for (let i = 0; i < clean.tags.length; i++) {
      const tag = clean.tags[i];
      if (!tag[0]) continue;
      const type = tag[0];
      const tHash = tagHash(uuid, tag, i);
      const valueParts = tag.slice(1);

      let setClause = `SET t${i}.type = '${esc(type)}'`;
      if (valueParts[0] !== undefined) setClause += `, t${i}.value = '${esc(valueParts[0])}'`;
      if (valueParts[1] !== undefined) setClause += `, t${i}.value1 = '${esc(valueParts[1])}'`;
      if (valueParts[2] !== undefined) setClause += `, t${i}.value2 = '${esc(valueParts[2])}'`;
      if (valueParts[3] !== undefined) setClause += `, t${i}.value3 = '${esc(valueParts[3])}'`;
      if (valueParts[4] !== undefined) setClause += `, t${i}.value4 = '${esc(valueParts[4])}'`;

      if (tagParts.length === 0) {
        tagParts.push(`MATCH (e:NostrEvent {id: '${clean.id}'})`);
      }
      tagParts.push(
        `MERGE (t${i}:NostrEventTag {uuid: '${esc(tHash)}'})`,
        setClause,
        `MERGE (e)-[:HAS_TAG]->(t${i})`,
      );
    }
    if (tagParts.length > 0) {
      statements.push(tagParts.join(' '));
    }

    // --- Statement 3: Explicit relationship wiring ---
    // For events with nodeFrom/nodeTo/relationshipType tags (explicit relationships)
    const nodeFrom = clean.tags.find(t => t[0] === 'nodeFrom')?.[1];
    const nodeTo = clean.tags.find(t => t[0] === 'nodeTo')?.[1];
    const relType = clean.tags.find(t => t[0] === 'relationshipType')?.[1];

    if (nodeFrom && nodeTo && relType && KNOWN_REL_TYPES.includes(relType)) {
      statements.push(
        `MERGE (a:NostrEvent {uuid: '${esc(nodeFrom)}'}) MERGE (b:NostrEvent {uuid: '${esc(nodeTo)}'}) MERGE (a)-[:${relType}]->(b)`
      );
    }

    // --- Statement 4: IS_THE_CONCEPT_FOR (Action 1) ---
    // When we import a Superset node (z-tag points to the canonical superset concept),
    // find the ListHeader that this Superset belongs to and wire IS_THE_CONCEPT_FOR.
    //
    // How we find the parent ListHeader:
    //   - The Superset's name follows the convention "the superset of all <plural>"
    //   - The ListHeader has a "names" tag whose second value (plural) matches <plural>
    //   - We also check by author: Superset and ListHeader should share the same pubkey
    //
    // This is a MERGE so it's idempotent — safe to run multiple times.
    if (zTag === getConfig('uuid.superset')) {
      // This event is a Superset node. Try to wire it to its parent concept.
      const nameTag = clean.tags.find(t => t[0] === 'name')?.[1] || '';
      // Extract the plural from "the superset of all <plural>"
      const pluralMatch = nameTag.match(/^the superset of all (.+)$/i);
      if (pluralMatch) {
        const plural = pluralMatch[1];
        // Find a ListHeader by this author whose names tag plural matches
        // Wire IS_THE_CONCEPT_FOR and add ClassThreadHeader label.
        // A node becomes a ClassThreadHeader when it has an IS_THE_CONCEPT_FOR
        // relationship to a Superset — that's the formal criterion.
        statements.push(
          `MATCH (superset:NostrEvent {uuid: '${esc(uuid)}'}) ` +
          `MATCH (header)-[:HAS_TAG]->(namesTag:NostrEventTag {type: 'names'}) ` +
          `WHERE (header:ListHeader OR header:ListItem) ` +
          `AND toLower(namesTag.value1) = toLower('${esc(plural)}') ` +
          `AND header.pubkey = '${clean.pubkey}' ` +
          `SET header:ClassThreadHeader ` +
          `MERGE (header)-[:IS_THE_CONCEPT_FOR]->(superset)`
        );
      }
    }

    // --- Statement 5: Implicit HAS_ELEMENT (Action 2) ---
    // When we import a ListItem with a z-tag pointing to a concept,
    // wire HAS_ELEMENT from the parent concept's Superset to this item.
    //
    // This covers the basic class thread termination:
    //   (Superset) -[:HAS_ELEMENT]-> (this ListItem)
    //
    // We only do this for items that are NOT special node types (Superset, Set,
    // Property, JSONSchema, Relationship) — those have their own wiring rules.
    // Superset nodes are handled by IS_THE_CONCEPT_FOR above.
    if (zTag && !specialLabel && kindLabel === 'ListItem') {
      // This is a plain element. Find its parent concept's Superset and wire HAS_ELEMENT.
      // The z-tag is the parent concept's UUID (a-tag for replaceable, event id for non-replaceable).
      statements.push(
        `MATCH (item:NostrEvent {uuid: '${esc(uuid)}'}) ` +
        `MATCH (parent {uuid: '${esc(zTag)}'})-[:IS_THE_CONCEPT_FOR]->(superset:Superset) ` +
        `MERGE (superset)-[:HAS_ELEMENT]->(item)`
      );
    }

    // --- Statement 6: REFERENCES relationships (Action 7) ---
    // For single-letter tags that reference other events or users:
    //   - "e" tags → REFERENCES to another NostrEvent (by event id)
    //   - "p" tags → REFERENCES to a NostrUser (by pubkey)
    //   - "a" tags → REFERENCES to another NostrEvent (by a-tag/uuid)
    for (const tag of clean.tags) {
      const type = tag[0];
      const value = tag[1];
      if (!value) continue;

      if (type === 'e') {
        // Reference to another event by id
        statements.push(
          `MATCH (src:NostrEvent {id: '${clean.id}'}) ` +
          `MERGE (tgt:NostrEvent {id: '${esc(value)}'}) ` +
          `MERGE (src)-[:REFERENCES]->(tgt)`
        );
      } else if (type === 'p') {
        // Reference to a user by pubkey
        statements.push(
          `MATCH (src:NostrEvent {id: '${clean.id}'}) ` +
          `MERGE (tgt:NostrUser {pubkey: '${esc(value)}'}) ` +
          `MERGE (src)-[:REFERENCES]->(tgt)`
        );
      } else if (type === 'a') {
        // Reference to a replaceable event by a-tag (which is the uuid)
        statements.push(
          `MATCH (src:NostrEvent {id: '${clean.id}'}) ` +
          `MERGE (tgt:NostrEvent {uuid: '${esc(value)}'}) ` +
          `MERGE (src)-[:REFERENCES]->(tgt)`
        );
      }
    }
  }

  // Execute all statements in one cypher-shell batch
  if (statements.length > 0) {
    await cypherBatch(statements);
  }

  log(`  ✅ ${events.length} event(s) imported to Neo4j (targeted)`);
}

/**
 * Run the full batchTransfer + setup pipeline.
 * This re-imports ALL events from strfry into Neo4j.
 *
 * @param {Object} opts
 * @param {boolean} opts.force - Skip confirmation prompt
 * @param {boolean} opts.quiet - Suppress output
 */
export async function fullResync(opts = {}) {
  const log = opts.quiet ? () => {} : console.log;

  if (!opts.force) {
    log('');
    log('  ⚠️  Full resync will re-import ALL events from strfry into Neo4j.');
    log('     This may re-create implicit edges that normalization has removed.');
    log('     Consider running `tapestry normalize check` afterwards.');
    log('');
    const ok = await confirm('  Proceed with full resync?');
    if (!ok) {
      log('  ❌ Aborted.');
      return false;
    }
  }

  log('  📊 Running batchTransfer.sh...');
  await execAsync(
    `docker exec ${getConfig('docker.container')} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/batchTransfer.sh`,
    { timeout: 120000 }
  );

  log('  🏷️  Running setup.sh...');
  await execAsync(
    `docker exec ${getConfig('docker.container')} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/setup.sh`,
    { timeout: 60000 }
  );

  log('  ✅ Full resync complete — labels and relationships applied');
  return true;
}

/**
 * Import events to strfry, then import to Neo4j (targeted).
 * This is the standard pattern for CLI commands that create 1-few events.
 *
 * @param {Array} events - Signed nostr event objects
 * @param {Object} opts
 * @param {boolean} opts.quiet - Suppress output
 */
export async function importEventsAndSync(events, opts = {}) {
  const log = opts.quiet ? () => {} : console.log;
  const { writeFileSync, unlinkSync } = await import('fs');

  // Clean events (remove non-standard fields like _signerLabel)
  const cleanEvents = events.map(e => ({
    id: e.id, pubkey: e.pubkey, created_at: e.created_at,
    kind: e.kind, tags: e.tags, content: e.content, sig: e.sig,
  }));

  // 1. Import to strfry
  const tmpFile = `/tmp/tapestry_import_${Date.now()}.jsonl`;
  writeFileSync(tmpFile, cleanEvents.map(e => JSON.stringify(e)).join('\n') + '\n');
  try {
    const { stdout } = await execAsync(
      `docker exec -i ${getConfig('docker.container')} strfry import < ${tmpFile} 2>&1`,
      { timeout: 30000 }
    );
    const m = stdout.match(/(\d+) added/);
    log(`  ✅ ${m ? m[1] : events.length} event(s) written to strfry`);
  } catch (err) {
    console.error(`  ❌ strfry import failed: ${err.message}`);
    throw err;
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }

  // 2. Targeted Neo4j import
  log('  📊 Updating Neo4j (targeted)...');
  await importToNeo4j(cleanEvents, opts);
}

/**
 * Escape single quotes for Cypher strings.
 */
function esc(str) {
  if (str === null || str === undefined) return '';
  // Escape backslashes and single quotes for Cypher string literals.
  // Do NOT escape $ — it's only special in bash double-quote contexts,
  // and our cypherBatch uses stdin pipe which avoids that.
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
