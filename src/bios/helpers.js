/**
 * BIOS Shared Helpers
 *
 * Thin client wrappers around the Tapestry server API.
 * BIOS scripts use these for consistency and readability.
 *
 * createConcept() calls POST /api/normalize/create-concept
 * createItem() calls POST /api/normalize/create-element
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { apiPost } from '../lib/api.js';
import { uuid as configUuid } from '../lib/config.js';

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
export const CANONICAL_UUIDS = new Proxy({}, {
  get(_, name) {
    return configUuid(name);
  }
});

// ─── Helper Functions ──────────────────────────────────────────────

/**
 * Create a concept with the full skeleton via the server API.
 *
 * CLI equivalent:
 *   tapestry concept create <name> --plural <plural> --description <desc>
 *
 * @param {object} opts
 * @param {string} opts.name - Singular name
 * @param {string} opts.plural - Plural name
 * @param {string} opts.description - Description
 * @returns {object} Server response with concept UUIDs
 */
export async function createConcept(opts) {
  console.log(`  📝 Creating concept: "${opts.name}" / "${opts.plural}"`);

  const result = await apiPost('/api/normalize/create-concept', {
    name: opts.name,
    plural: opts.plural,
    description: opts.description,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  const c = result.concept;
  console.log(`     ✅ ${result.message}`);
  console.log(`        Header:    ${c.uuid}`);
  console.log(`        Superset:  ${c.superset}`);
  console.log(`        Schema:    ${c.schema}`);

  return result;
}

/**
 * Create a list item (element of a concept) via the server API.
 *
 * CLI equivalent:
 *   tapestry concept add <concept> <item-name>
 *
 * @param {object} opts
 * @param {string} opts.name - Item name
 * @param {string} opts.concept - Parent concept name
 * @param {string} [opts.description] - Description
 * @returns {object} Server response with element UUID
 */
export async function createItem({ name, concept, description }) {
  console.log(`  📝 Creating item: "${name}" in concept "${concept}"`);

  const result = await apiPost('/api/normalize/create-element', {
    concept,
    name,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  console.log(`     ✅ ${result.message}`);
  console.log(`        UUID: ${result.element.uuid}`);

  return result;
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
