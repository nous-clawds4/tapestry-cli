/**
 * tapestry concept slug <concept> [slug-value] — show or set the slug for a concept
 *
 * Slugs are camelCase identifiers used as namespace keys in element JSON data.
 * If no slug value is provided, shows the current slug (or suggests one).
 * If a slug value is provided, publishes a replacement event with the slug tag added.
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { apiGet } from '../lib/api.js';
import { signEvent } from '../lib/signer.js';
import { importToNeo4j } from '../lib/neo4j.js';
import { getConfig } from '../lib/config.js';

const execAsync = promisify(execCb);

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
 * Convert a concept name to a camelCase slug.
 */
function toCamelCase(name) {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export function slugCommand(concept) {
  concept
    .command('slug <concept-name> [slug-value]')
    .description('Show or set the slug for a concept (used as JSON namespace key)')
    .option('--personal', 'Sign with personal nsec from 1Password')
    .option('--dry-run', 'Show what would be created without doing it')
    .action(async (conceptName, slugValue, opts) => {
      await handleSlug(conceptName, slugValue, opts);
    });
}

async function handleSlug(conceptName, slugValue, opts) {
  console.log(`\n🏷️  Slug for concept "${conceptName}"\n`);

  // Find the concept
  const esc = conceptName.replace(/'/g, "\\'");
  const rows = await cypher(
    `MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) ` +
    `WHERE toLower(t.value) = toLower('${esc}') ` +
    `OPTIONAL MATCH (h)-[:HAS_TAG]->(s:NostrEventTag {type: 'slug'}) ` +
    `RETURN h.uuid AS uuid, t.value AS name, t.value1 AS plural, s.value AS slug LIMIT 1`
  );

  if (rows.length === 0) {
    console.error(`  ❌ Concept "${conceptName}" not found.`);
    process.exit(1);
  }

  const concept = rows[0];
  console.log(`  📌 Concept: "${concept.name}" (${concept.uuid})`);

  if (concept.slug) {
    console.log(`  🏷️  Current slug: ${concept.slug}`);
    if (!slugValue) {
      console.log('');
      return;
    }
  }

  if (!slugValue) {
    const suggested = toCamelCase(concept.name);
    console.log(`  ❌ No slug set.`);
    console.log(`  💡 Suggested: ${suggested}`);
    console.log(`\n  To set it: tapestry concept slug "${concept.name}" ${suggested}\n`);
    return;
  }

  // Check uniqueness
  const dupes = await cypher(
    `MATCH (h:ListHeader)-[:HAS_TAG]->(s:NostrEventTag {type: 'slug'}) ` +
    `WHERE s.value = '${slugValue.replace(/'/g, "\\'")}' AND h.uuid <> '${concept.uuid}' ` +
    `RETURN h.uuid AS uuid LIMIT 1`
  );
  if (dupes.length > 0) {
    console.error(`  ❌ Slug "${slugValue}" is already used by another concept (${dupes[0].uuid}).`);
    process.exit(1);
  }

  // We need to get the original event from strfry and republish with slug tag added
  const uuidParts = concept.uuid.split(':');
  const kind = parseInt(uuidParts[0]);
  const dTagValue = uuidParts.slice(2).join(':');

  console.log(`  📝 Adding slug "${slugValue}" to concept...`);

  // Get original event from strfry
  const filter = kind >= 30000
    ? JSON.stringify({ kinds: [kind], '#d': [dTagValue] })
    : JSON.stringify({ ids: [concept.uuid] });

  const escapedFilter = filter.replace(/'/g, "'\\''");
  const { stdout: eventJson } = await execAsync(
    `docker exec ${getConfig('docker.container')} strfry scan '${escapedFilter}' 2>/dev/null`,
    { timeout: 15000 }
  );

  const origEvent = JSON.parse(eventJson.trim().split('\n').pop());

  // Check if slug tag already exists
  const hasSlug = origEvent.tags.some(t => t[0] === 'slug');
  let newTags;
  if (hasSlug) {
    newTags = origEvent.tags.map(t => t[0] === 'slug' ? ['slug', slugValue] : t);
  } else {
    newTags = [...origEvent.tags, ['slug', slugValue]];
  }

  if (opts.dryRun) {
    console.log(`\n  🏜️  Dry run — would republish event with tags:`);
    console.log(`     ${JSON.stringify(newTags)}`);
    console.log('');
    return;
  }

  // Sign replacement event (same kind, same d-tag = replaces original for replaceable events)
  const newEvent = await signEvent({
    kind: origEvent.kind,
    tags: newTags,
    content: origEvent.content,
  }, { personal: opts.personal });

  const clean = {
    id: newEvent.id,
    pubkey: newEvent.pubkey,
    created_at: newEvent.created_at,
    kind: newEvent.kind,
    tags: newEvent.tags,
    content: newEvent.content,
    sig: newEvent.sig,
  };

  // Check if signer matches original
  if (newEvent.pubkey !== origEvent.pubkey) {
    console.log(`  ⚠️  Original event signed by ${origEvent.pubkey.slice(0, 12)}...`);
    console.log(`     New event signed by ${newEvent.pubkey.slice(0, 12)}...`);
    console.log(`     This creates a new event rather than replacing the original.`);
    console.log(`     Use --personal if the original was signed by your personal key.`);
  }

  // Import to strfry
  const tmpFile = `/tmp/tapestry_slug_${Date.now()}.jsonl`;
  writeFileSync(tmpFile, JSON.stringify(clean) + '\n');
  try {
    const { stdout } = await execAsync(
      `docker exec -i ${getConfig('docker.container')} strfry import < ${tmpFile} 2>&1`,
      { timeout: 30000 }
    );
    console.log(`  ✅ Event written to strfry`);
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }

  // Update Neo4j (targeted)
  console.log('  📊 Updating Neo4j (targeted)...');
  await importToNeo4j([newEvent]);

  console.log(`\n✨ Slug "${slugValue}" set for concept "${concept.name}"!\n`);
}
