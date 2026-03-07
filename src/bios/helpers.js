/**
 * BIOS Shared Helpers
 * 
 * Thin wrappers around the tapestry-cli library functions.
 * BIOS scripts use these for consistency and readability.
 *
 * createConcept() delegates to src/lib/concept.js — creates the full skeleton:
 *   ListHeader (labeled ConceptHeader), Superset, JSON Schema,
 *   3 graph nodes (core nodes, concept graph, property tree), 5 relationship events,
 *   and JSON tags on all 6 primary nodes.
 *
 * createItem() creates a single kind 39999 ListItem (element of a concept).
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';
import { createConcept as createFullConcept } from '../lib/concept.js';
import { signEvent } from '../lib/signer.js';
import { importToNeo4j } from '../lib/neo4j.js';
import { getConfig, uuid as configUuid } from '../lib/config.js';

const execAsync = promisify(execCb);

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, '..', '..', '.env');
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* no .env */ }

// ─── Canonical Concept UUIDs ───────────────────────────────────────
// Loaded from config.js (which supports user overrides via .tapestry.json).
// Use CANONICAL_UUIDS.superset etc. — these resolve at call time.

export const CANONICAL_UUIDS = new Proxy({}, {
  get(_, name) {
    return configUuid(name);
  }
});

// ─── Helper Functions ──────────────────────────────────────────────

/**
 * Generate a random d-tag (8-character hex string).
 */
export function randomDTag() {
  return randomBytes(4).toString('hex');
}

/**
 * Create a concept with the full skeleton: ListHeader, Superset, JSON Schema,
 * 3 graph nodes, 5 relationship events, and JSON tags on all nodes.
 * 
 * Delegates to src/lib/concept.js createConcept().
 * 
 * CLI equivalent:
 *   tapestry concept create <name> --plural <plural> --description <desc>
 * 
 * @param {object} opts
 * @param {string} opts.name - Singular name
 * @param {string} opts.plural - Plural name
 * @param {string} opts.description - Description
 * @param {string} [opts.dTag] - Custom d-tag (default: random)
 * @param {string} [opts.slug] - Explicit slug
 * @returns {object} { header, superset, schema, coreNodesGraph, conceptGraph, propertyTreeGraph, relationships }
 *   Each has { event, aTag }.
 */
export async function createConcept(opts) {
  return createFullConcept(opts);
}

/**
 * Create a list item (kind 39999), publish to strfry, import to Neo4j.
 * 
 * CLI equivalent:
 *   tapestry concept add <concept> <item-name>
 * 
 * @param {object} opts
 * @param {string} opts.name - Item name
 * @param {string} opts.parentUuid - z-tag value (parent concept's a-tag)
 * @param {string} [opts.description] - Description
 * @param {string} [opts.dTag] - Custom d-tag
 * @param {Array} [opts.extraTags] - Additional tags
 * @returns {object} { event, aTag }
 */
export async function createItem({ name, parentUuid, description, dTag, extraTags = [] }) {
  const d = dTag || randomDTag();
  
  const tags = [
    ['d', d],
    ['name', name],
    ['z', parentUuid],
    ...extraTags,
  ];
  if (description) tags.push(['description', description]);

  console.log(`  📝 Creating item: "${name}" (parent: ...${parentUuid.slice(-12)})`);
  
  const event = await signEvent({ kind: 39999, tags, content: '' });
  await publishToStrfry(event);
  await importToNeo4j([event]);
  
  const aTag = `39999:${event.pubkey}:${d}`;
  console.log(`     ✅ ${name} → ${aTag}`);
  
  return { event, aTag };
}

/**
 * Publish a signed event to the local strfry relay.
 */
export async function publishToStrfry(event) {
  const eventJson = JSON.stringify(event);
  const cmd = `echo '${eventJson.replace(/'/g, "'\\''")}' | docker exec -i ${getConfig('docker.container')} strfry import 2>&1`;
  const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
  const output = (stdout || '') + (stderr || '');
  const match = output.match(/(\d+) added, (\d+) rejected, (\d+) dups/);
  if (match && parseInt(match[2]) > 0) {
    throw new Error(`strfry rejected the event: ${output}`);
  }
}

/**
 * Print a section header.
 */
export function header(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(60)}\n`);
}

/**
 * Print a step description.
 */
export function step(num, description) {
  console.log(`\n── Step ${num}: ${description} ──\n`);
}
