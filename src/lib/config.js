/**
 * Tapestry CLI Configuration
 *
 * Single source of truth for all configuration values (UUIDs, relays, etc.).
 *
 * Resolution order:
 *   1. User overrides  — persistent file at <project-root>/.tapestry.json
 *   2. Hardcoded defaults — the DEFAULTS object below
 *   3. (Future) Concept graph lookup
 *
 * All command files should import from here instead of hardcoding constants.
 *
 * Usage:
 *   import { getConfig, getAllConfig } from '../lib/config.js';
 *   const supersetUuid = getConfig('uuid.superset');
 *   const relays = getConfig('relays.publish');
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const CONFIG_FILE = resolve(PROJECT_ROOT, '.tapestry.json');

// ─── Hardcoded Defaults ────────────────────────────────────────────
//
// These are the "factory" values. They use the Tapestry Assistant's pubkey
// because the TA is the canonical system signer — all BIOS scripts, all
// createConcept() output, everything new goes through it.
//
// Dave's original concepts (pubkey e5272de...) are the historical originals
// but the TA's copies are the working set for a self-consistent local instance.
//
// If you bootstrap a fresh instance with a different signer, override these
// via `tapestry config set uuid.superset <new-value>`.

const TA_PUBKEY = '2d1fe9d3e0a3f3c0cf41812ba2075eb931b535b432fbdb2a6da430593d569e38';

const DEFAULTS = {
  // ── Canonical concept UUIDs ──
  // These are the a-tags for the meta-concepts that define the graph structure.
  // Format: <kind>:<pubkey>:<d-tag>
  'uuid.superset':         `39998:${TA_PUBKEY}:21cbf5be-c972-4f45-ae09-c57e165e8cf9`,
  'uuid.set':              `39998:${TA_PUBKEY}:6a339361-beef-4013-a916-1723e05a4671`,
  'uuid.relationship':     `39998:${TA_PUBKEY}:c15357e6-6665-45cc-8ea5-0320b8026f05`,
  'uuid.relationshipType': `39998:${TA_PUBKEY}:826fa669-b494-46bd-9326-97b894c70d8b`,
  'uuid.property':         `39998:${TA_PUBKEY}:6c6a1f9e-6afc-4283-9798-cd2f68c522a7`,
  'uuid.jsonSchema':       `39998:${TA_PUBKEY}:bba896cc-c190-4e26-a26f-66d678d4ac89`,
  'uuid.nodeType':         `39998:${TA_PUBKEY}:1276c2c4-8efb-41b1-ae88-11ca61b4e572`,
  'uuid.list':             `39998:${TA_PUBKEY}:cf85c5ea-7eb2-407e-bb5d-eac060f36cc8`,
  'uuid.jsonDataType':     `39998:${TA_PUBKEY}:0689c759-a2ab-46ab-8bc9-e4691ab9eb56`,
  'uuid.graphType':        `39998:${TA_PUBKEY}:ec92cbdd`,
  'uuid.graph':            `39998:${TA_PUBKEY}:ec1b87c4`,

  // ── Graph Type UUIDs ──
  // These are the a-tags for the graph types that every concept gets.
  // (Will be populated once BIOS scripts create them, or fetched from existing graph.)
  // 'uuid.graphType.conceptGraph':  '', // TBD
  // 'uuid.graphType.propertyTree':  '', // TBD
  // 'uuid.graphType.coreNodes':     '', // TBD

  // ── Relationship Types ──
  // The relationship types used to wire graph nodes to Concept Headers.
  // These are the Neo4j relationship type strings, not UUIDs.
  'rel.classThreadInitiation':   'IS_THE_CONCEPT_FOR',
  'rel.classThreadPropagation':  'IS_A_SUPERSET_OF',
  'rel.classThreadTermination':  'HAS_ELEMENT',
  'rel.propertyOf':              'IS_A_PROPERTY_OF',
  'rel.schemaFor':               'IS_THE_JSON_SCHEMA_FOR',
  'rel.enumerates':              'ENUMERATES',
  'rel.import':                  'IMPORT',
  'rel.supercedes':              'SUPERCEDES',
  'rel.providedTemplateFor':     'PROVIDED_THE_TEMPLATE_FOR',
  'rel.conceptGraphFor':         'IS_THE_CONCEPT_GRAPH_FOR',
  'rel.propertyTreeGraphFor':    'IS_THE_PROPERTY_TREE_GRAPH_FOR',
  'rel.coreGraphFor':            'IS_THE_CORE_GRAPH_FOR',
  'rel.primaryPropertyFor':      'IS_THE_PRIMARY_PROPERTY_FOR',
  'rel.propertiesSetFor':        'IS_THE_PROPERTIES_SET_FOR',

  // ── Relays ──
  'relays.publish': [
    'wss://dcosl.brainstorm.world',
    'wss://dcosl.brainstorm.social/relay',
  ],
  'relays.profile': [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.primal.net',
  ],

  // ── Docker ──
  'docker.container': 'tapestry',

  // ── Neo4j ──
  'neo4j.user':     'neo4j',
  'neo4j.password': '3wGDrv6c8svbHVxKiXPL',
};

// ─── User Overrides ────────────────────────────────────────────────

let _overrides = null;

/**
 * Load user overrides from .tapestry.json.
 * Cached in memory after first load.
 */
function loadOverrides() {
  if (_overrides !== null) return _overrides;
  if (existsSync(CONFIG_FILE)) {
    try {
      _overrides = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    } catch (err) {
      console.error(`  ⚠️  Failed to parse ${CONFIG_FILE}: ${err.message}`);
      _overrides = {};
    }
  } else {
    _overrides = {};
  }
  return _overrides;
}

/**
 * Save user overrides to .tapestry.json.
 */
function saveOverrides(overrides) {
  _overrides = overrides;
  writeFileSync(CONFIG_FILE, JSON.stringify(overrides, null, 2) + '\n');
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Get a config value by key.
 * Resolution: user override → hardcoded default → undefined.
 *
 * @param {string} key - Dot-separated key, e.g. 'uuid.superset'
 * @returns {*} The config value, or undefined if not found
 */
export function getConfig(key) {
  const overrides = loadOverrides();
  if (key in overrides) return overrides[key];
  if (key in DEFAULTS) return DEFAULTS[key];
  return undefined;
}

/**
 * Set a user override for a config key.
 * Persists to .tapestry.json.
 *
 * @param {string} key
 * @param {*} value
 */
export function setConfig(key, value) {
  const overrides = loadOverrides();
  overrides[key] = value;
  saveOverrides(overrides);
}

/**
 * Remove a user override, reverting to the default.
 *
 * @param {string} key
 * @returns {boolean} True if an override existed and was removed
 */
export function resetConfig(key) {
  const overrides = loadOverrides();
  if (key in overrides) {
    delete overrides[key];
    saveOverrides(overrides);
    return true;
  }
  return false;
}

/**
 * Get all config keys with their current values and sources.
 * Returns an array of { key, value, source } objects.
 *   source: 'override' | 'default'
 */
export function getAllConfig() {
  const overrides = loadOverrides();
  const allKeys = new Set([...Object.keys(DEFAULTS), ...Object.keys(overrides)]);
  const result = [];

  for (const key of [...allKeys].sort()) {
    if (key in overrides) {
      result.push({ key, value: overrides[key], source: 'override', default: DEFAULTS[key] });
    } else {
      result.push({ key, value: DEFAULTS[key], source: 'default' });
    }
  }

  return result;
}

/**
 * Get all default values (for reference/comparison).
 */
export function getDefaults() {
  return { ...DEFAULTS };
}

/**
 * Get the path to the config file.
 */
export function getConfigPath() {
  return CONFIG_FILE;
}

// ─── Convenience Accessors ─────────────────────────────────────────
// These make the most common lookups readable at the call site.

/** Get a canonical concept UUID by short name. */
export function uuid(name) {
  return getConfig(`uuid.${name}`);
}

/** Get the label map (z-tag → Neo4j label) derived from current UUIDs. */
export function getLabelMap() {
  return {
    [getConfig('uuid.set')]:        'Set',
    [getConfig('uuid.superset')]:   'Superset',
    [getConfig('uuid.jsonSchema')]: 'JSONSchema',
    [getConfig('uuid.property')]:   'Property',
    [getConfig('uuid.relationship')]: 'Relationship',
  };
}
