/**
 * Concept creation library.
 *
 * createConcept() creates the full skeleton for a new concept:
 *
 *   1. Concept Header / ListHeader (kind 39998)
 *   2. Superset (kind 39999, z → uuid.superset)
 *   3. JSON Schema (kind 39999, z → uuid.jsonSchema)
 *   4. Core Nodes Graph (kind 39999, z → uuid.graph)
 *   5. Concept Graph (kind 39999, z → uuid.graph)
 *   6. Property Tree Graph (kind 39999, z → uuid.graph)
 *
 * Plus wiring (both as Neo4j relationships and as explicit relationship events
 * recorded in the Core Nodes Graph's json tag):
 *
 *   - ConceptHeader → IS_THE_CONCEPT_FOR → Superset
 *   - JSON Schema → IS_THE_JSON_SCHEMA_FOR → ConceptHeader
 *   - Core Nodes Graph → IS_THE_CORE_GRAPH_FOR → ConceptHeader
 *   - Concept Graph → IS_THE_CONCEPT_GRAPH_FOR → ConceptHeader
 *   - Property Tree Graph → IS_THE_PROPERTY_TREE_GRAPH_FOR → ConceptHeader
 */

import { randomBytes } from 'crypto';
import { signEvent } from './signer.js';
import { importToNeo4j } from './neo4j.js';
import { getConfig, uuid as configUuid } from './config.js';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(execCb);

/**
 * Generate a random d-tag (8-character hex string).
 */
function randomDTag() {
  return randomBytes(4).toString('hex');
}

// ─── Naming Convention Derivation ──────────────────────────────────
//
// From a singular and plural name (e.g. "coffee house", "coffee houses"),
// derive all 5 naming conventions used in the Concept Header:
//   oNames  — lowercase as-is
//   oSlugs  — kebab-case
//   oKeys   — camelCase
//   oTitles — Title Case
//   oLabels — PascalCase (no spaces)

/**
 * Convert a name to kebab-case slug.
 * "coffee house" → "coffee-house"
 */
function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Convert a name to camelCase key.
 * "coffee house" → "coffeeHouse"
 */
function toKey(name) {
  const words = name.split(/\s+/);
  return words.map((w, i) => {
    const lower = w.toLowerCase();
    if (i === 0) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join('');
}

/**
 * Convert a name to Title Case.
 * "coffee house" → "Coffee House"
 */
function toTitle(name) {
  return name.split(/\s+/).map(w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * Convert a name to PascalCase label (no spaces).
 * "coffee house" → "CoffeeHouse"
 */
function toLabel(name) {
  return name.split(/\s+/).map(w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join('');
}

/**
 * Derive all 5 naming conventions from singular and plural names.
 */
function deriveNames(singular, plural) {
  return {
    oNames:  { singular: singular.toLowerCase(), plural: plural.toLowerCase() },
    oSlugs:  { singular: toSlug(singular), plural: toSlug(plural) },
    oKeys:   { singular: toKey(singular), plural: toKey(plural) },
    oTitles: { singular: toTitle(singular), plural: toTitle(plural) },
    oLabels: { singular: toLabel(singular), plural: toLabel(plural) },
  };
}

/**
 * Publish a signed event to the local strfry relay.
 */
async function publishToStrfry(event) {
  const container = getConfig('docker.container');
  const eventJson = JSON.stringify(event);
  const cmd = `echo '${eventJson.replace(/'/g, "'\\''")}' | docker exec -i ${container} strfry import 2>&1`;
  const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
  const output = (stdout || '') + (stderr || '');
  const match = output.match(/(\d+) added, (\d+) rejected, (\d+) dups/);
  if (match && parseInt(match[2]) > 0) {
    throw new Error(`strfry rejected the event: ${output}`);
  }
}

/**
 * Sign, publish to strfry, and import to Neo4j.
 * Returns the signed event and its a-tag (uuid).
 */
async function createAndImport(template, opts = {}) {
  const event = await signEvent(template, { personal: opts.personal });
  await publishToStrfry(event);

  const isReplaceable = event.kind >= 30000;
  const dTag = event.tags.find(t => t[0] === 'd')?.[1];
  const aTag = isReplaceable ? `${event.kind}:${event.pubkey}:${dTag}` : event.id;

  return { event, aTag };
}

/**
 * Create a full concept skeleton.
 *
 * @param {object} opts
 * @param {string} opts.name - Singular name (e.g. "coffee house")
 * @param {string} opts.plural - Plural name (e.g. "coffee houses")
 * @param {string} [opts.description] - Concept description
 * @param {string} [opts.slug] - Override kebab-case slug (default: derived from name)
 * @param {string} [opts.key] - Override camelCase key (default: derived from name)
 * @param {string} [opts.dTag] - Custom d-tag for the ListHeader
 * @param {boolean} [opts.personal] - Sign with personal nsec from 1Password
 * @param {boolean} [opts.quiet] - Suppress output
 * @param {boolean} [opts.skipImport] - Skip Neo4j import (create events only)
 *
 * @returns {object} {
 *   header: { event, aTag },
 *   superset: { event, aTag },
 *   schema: { event, aTag },
 *   coreNodesGraph: { event, aTag },
 *   conceptGraph: { event, aTag },
 *   propertyTreeGraph: { event, aTag },
 *   relationships: [{ event, aTag }, ...]
 * }
 */
export async function createConcept(opts) {
  const {
    name,
    plural = name + 's',
    description,
    dTag,
    personal,
    quiet,
    skipImport,
  } = opts;

  const log = quiet ? () => {} : console.log;
  const signerOpts = { personal };

  // Derive all naming conventions
  const names = deriveNames(name, plural);

  // Allow overrides for slug and key
  if (opts.slug) {
    names.oSlugs.singular = opts.slug;
    // Derive plural slug from override if not explicitly different
    if (!opts.slug.endsWith('s')) {
      names.oSlugs.plural = opts.slug + 's';
    }
  }
  if (opts.key) {
    names.oKeys.singular = opts.key;
  }

  const slug = names.oSlugs.singular;
  const key = names.oKeys.singular;

  // We'll collect all events and import them in one batch at the end
  const allEvents = [];

  // ── 1. Concept Header / ListHeader (kind 39998) ─────────────────
  log(`\n🧵 Creating concept: "${name}"\n`);
  log(`  📝 Step 1: Concept Header`);

  const headerDTag = dTag || randomDTag();

  // Build the word JSON for the Concept Header per concept-header.md
  const headerWord = {
    word: {
      slug: `concept-header-for-the-concept-of-${names.oSlugs.plural}`,
      name: `concept header for the concept of ${names.oNames.plural}`,
      title: `Concept Header for the Concept of ${names.oTitles.plural}`,
      wordTypes: ['word', 'conceptHeader'],
    },
    conceptHeader: {
      description: description || `${names.oTitles.singular} is a concept.`,
      oNames: names.oNames,
      oSlugs: names.oSlugs,
      oKeys: names.oKeys,
      oTitles: names.oTitles,
      oLabels: names.oLabels,
    },
  };

  const headerTags = [
    ['d', headerDTag],
    ['names', names.oNames.singular, names.oNames.plural],
    ['slug', slug],
    ['json', JSON.stringify(headerWord)],
  ];
  if (description) headerTags.push(['description', description]);

  const headerEvent = await signEvent({ kind: 39998, tags: headerTags, content: '' }, signerOpts);
  const headerATag = `39998:${headerEvent.pubkey}:${headerDTag}`;
  await publishToStrfry(headerEvent);
  allEvents.push(headerEvent);

  log(`     ✅ ${name} → ${headerATag}`);

  // ── 2. Superset (kind 39999) ────────────────────────────────────
  log(`  📝 Step 2: Superset`);

  const supersetDTag = `${slug}-superset`;
  const supersetWord = {
    word: {
      slug: `superset-for-the-concept-of-${names.oSlugs.plural}`,
      name: `superset for the concept of ${names.oNames.plural}`,
      title: `Superset for the Concept of ${names.oTitles.plural}`,
      wordTypes: ['word', 'superset'],
      coreMemberOf: [{ slug: `concept-header-for-the-concept-of-${names.oSlugs.plural}`, uuid: headerATag }],
    },
    superset: {
      slug: names.oSlugs.plural,
      name: names.oNames.plural,
      title: names.oTitles.plural,
      description: `This is the superset of all known ${names.oNames.plural}.`,
    },
  };

  const supersetEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', supersetDTag],
      ['name', supersetWord.word.name],
      ['z', configUuid('superset')],
      ['description', supersetWord.superset.description],
      ['json', JSON.stringify(supersetWord)],
    ],
    content: '',
  }, signerOpts);
  const supersetATag = `39999:${supersetEvent.pubkey}:${supersetDTag}`;
  await publishToStrfry(supersetEvent);
  allEvents.push(supersetEvent);

  log(`     ✅ ${supersetWord.word.name} → ${supersetATag}`);

  // ── 3. JSON Schema (kind 39999) ─────────────────────────────────
  log(`  📝 Step 3: JSON Schema`);

  const schemaDTag = `${slug}-schema`;
  const schemaWord = {
    word: {
      slug: `json-schema-for-the-concept-of-${names.oSlugs.plural}`,
      name: `JSON schema for the concept of ${names.oNames.plural}`,
      title: `JSON Schema for the Concept of ${names.oTitles.plural}`,
      description: `the json schema for the concept of ${names.oNames.plural}`,
      wordTypes: ['word', 'jsonSchema'],
      coreMemberOf: [{ slug: `concept-header-for-the-concept-of-${names.oSlugs.plural}`, uuid: headerATag }],
    },
    jsonSchema: {},
  };

  const schemaEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', schemaDTag],
      ['name', schemaWord.word.name],
      ['z', configUuid('jsonSchema')],
      ['description', schemaWord.word.description],
      ['json', JSON.stringify(schemaWord)],
    ],
    content: '',
  }, signerOpts);
  const schemaATag = `39999:${schemaEvent.pubkey}:${schemaDTag}`;
  await publishToStrfry(schemaEvent);
  allEvents.push(schemaEvent);

  log(`     ✅ ${schemaWord.word.name} → ${schemaATag}`);

  // ── 4. Property Tree Graph (kind 39999) ─────────────────────────
  log(`  📝 Step 4: Property Tree Graph`);

  const ptGraphDTag = `${slug}-property-tree-graph`;
  const ptGraphWord = {
    word: {
      slug: `property-tree-graph-for-the-concept-of-${names.oSlugs.plural}`,
      name: `property tree graph for the concept of ${names.oNames.plural}`,
      title: `Property Tree Graph for the Concept of ${names.oTitles.plural}`,
      wordTypes: ['word', 'graph', 'propertyTreeGraph'],
      coreMemberOf: [{ slug: `concept-header-for-the-concept-of-${names.oSlugs.plural}`, uuid: headerATag }],
    },
    graph: {
      nodes: [
        { slug: `json-schema-for-the-concept-of-${names.oSlugs.plural}`, uuid: schemaATag },
      ],
      relationshipTypes: [
        { slug: 'IS_A_PROPERTY_OF' },
      ],
      relationships: [],
      imports: [],
    },
    propertyTreeGraph: {
      description: `the collection of the JSON schema node, all property nodes and all of their connections for the concept of ${names.oNames.plural}`,
    },
  };

  const ptGraphEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', ptGraphDTag],
      ['name', ptGraphWord.word.name],
      ['z', configUuid('graph')],
      ['description', ptGraphWord.propertyTreeGraph.description],
      ['json', JSON.stringify(ptGraphWord)],
    ],
    content: '',
  }, signerOpts);
  const ptGraphATag = `39999:${ptGraphEvent.pubkey}:${ptGraphDTag}`;
  await publishToStrfry(ptGraphEvent);
  allEvents.push(ptGraphEvent);

  log(`     ✅ ${ptGraphWord.word.name} → ${ptGraphATag}`);

  // ── 5. Concept Graph (kind 39999) ───────────────────────────────
  log(`  📝 Step 5: Concept Graph`);

  const cgGraphDTag = `${slug}-concept-graph`;
  const cgGraphWord = {
    word: {
      slug: `concept-graph-for-the-concept-of-${names.oSlugs.plural}`,
      name: `concept graph for the concept of ${names.oNames.plural}`,
      title: `Concept Graph for the Concept of ${names.oTitles.plural}`,
      wordTypes: ['word', 'graph', 'conceptGraph'],
      coreMemberOf: [{ slug: `concept-header-for-the-concept-of-${names.oSlugs.plural}`, uuid: headerATag }],
    },
    graph: {
      nodes: [
        { slug: `concept-header-for-the-concept-of-${names.oSlugs.plural}`, uuid: headerATag },
        { slug: `superset-for-the-concept-of-${names.oSlugs.plural}`, uuid: supersetATag },
      ],
      relationshipTypes: [
        { slug: 'IS_THE_CONCEPT_FOR', uuid: '' },
        { slug: 'IS_A_SUPERSET_OF', uuid: '' },
        { slug: 'HAS_ELEMENT', uuid: '' },
      ],
      relationships: [
        {
          nodeFrom: { slug: `concept-header-for-the-concept-of-${names.oSlugs.plural}` },
          relationshipType: { slug: 'IS_THE_CONCEPT_FOR' },
          nodeTo: { slug: `superset-for-the-concept-of-${names.oSlugs.plural}` },
        },
      ],
      imports: [
        { slug: `property-tree-graph-for-the-concept-of-${names.oSlugs.plural}`, uuid: ptGraphATag },
        // Core nodes graph UUID will be filled in after step 6
      ],
    },
    conceptGraph: {
      description: `The collection of all nodes and edges traversed by the class threads of the concept of ${names.oNames.plural}`,
      cypher: `MATCH classPath = (conceptHeader)-[:IS_THE_CONCEPT_FOR]->(superset:Superset)-[:IS_A_SUPERSET_OF *0..5]->()-[:HAS_ELEMENT]->() WHERE conceptHeader.uuid = '${headerATag}' RETURN classPath`,
    },
  };

  const cgGraphEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', cgGraphDTag],
      ['name', cgGraphWord.word.name],
      ['z', configUuid('graph')],
      ['description', cgGraphWord.conceptGraph.description],
      ['json', JSON.stringify(cgGraphWord)],
    ],
    content: '',
  }, signerOpts);
  const cgGraphATag = `39999:${cgGraphEvent.pubkey}:${cgGraphDTag}`;
  await publishToStrfry(cgGraphEvent);
  allEvents.push(cgGraphEvent);

  log(`     ✅ ${cgGraphWord.word.name} → ${cgGraphATag}`);

  // ── 6. Core Nodes Graph (kind 39999) ────────────────────────────
  log(`  📝 Step 6: Core Nodes Graph`);

  const coreGraphDTag = `${slug}-core-nodes-graph`;
  const slugPlural = names.oSlugs.plural;
  const coreGraphWord = {
    word: {
      slug: `core-nodes-graph-for-the-concept-of-${slugPlural}`,
      name: `core nodes graph for the concept of ${names.oNames.plural}`,
      title: `Core Nodes Graph for the Concept of ${names.oTitles.plural}`,
      wordTypes: ['word', 'graph', 'coreNodesGraph'],
      coreMemberOf: [{ slug: `concept-header-for-the-concept-of-${slugPlural}`, uuid: headerATag }],
    },
    graph: {
      nodes: [
        { slug: `concept-header-for-the-concept-of-${slugPlural}`, uuid: headerATag },
        { slug: `superset-for-the-concept-of-${slugPlural}`, uuid: supersetATag },
        { slug: `json-schema-for-the-concept-of-${slugPlural}`, uuid: schemaATag },
        // Primary Property and Properties not yet created — placeholders for future
        { slug: `property-tree-graph-for-the-concept-of-${slugPlural}`, uuid: ptGraphATag },
        { slug: `concept-graph-for-the-concept-of-${slugPlural}`, uuid: cgGraphATag },
        // Core Nodes Graph UUID is self-referential — filled in after signing
      ],
      relationshipTypes: [
        { slug: 'IS_THE_CONCEPT_FOR' },
        { slug: 'IS_THE_JSON_SCHEMA_FOR' },
        { slug: 'IS_THE_PROPERTY_TREE_GRAPH_FOR' },
        { slug: 'IS_THE_CORE_GRAPH_FOR' },
        { slug: 'IS_THE_CONCEPT_GRAPH_FOR' },
      ],
      relationships: [
        {
          nodeFrom: { slug: `concept-header-for-the-concept-of-${slugPlural}` },
          relationshipType: { slug: 'IS_THE_CONCEPT_FOR' },
          nodeTo: { slug: `superset-for-the-concept-of-${slugPlural}` },
        },
        {
          nodeFrom: { slug: `json-schema-for-the-concept-of-${slugPlural}` },
          relationshipType: { slug: 'IS_THE_JSON_SCHEMA_FOR' },
          nodeTo: { slug: `concept-header-for-the-concept-of-${slugPlural}` },
        },
        {
          nodeFrom: { slug: `property-tree-graph-for-the-concept-of-${slugPlural}` },
          relationshipType: { slug: 'IS_THE_PROPERTY_TREE_GRAPH_FOR' },
          nodeTo: { slug: `concept-header-for-the-concept-of-${slugPlural}` },
        },
        {
          nodeFrom: { slug: `core-nodes-graph-for-the-concept-of-${slugPlural}` },
          relationshipType: { slug: 'IS_THE_CORE_GRAPH_FOR' },
          nodeTo: { slug: `concept-header-for-the-concept-of-${slugPlural}` },
        },
        {
          nodeFrom: { slug: `concept-graph-for-the-concept-of-${slugPlural}` },
          relationshipType: { slug: 'IS_THE_CONCEPT_GRAPH_FOR' },
          nodeTo: { slug: `concept-header-for-the-concept-of-${slugPlural}` },
        },
      ],
      imports: [],
    },
    coreNodesGraph: {
      description: `the set of core nodes for the concept of ${names.oNames.plural}`,
      constituents: {
        conceptHeader: headerATag,
        superset: supersetATag,
        jsonSchema: schemaATag,
        primaryProperty: '',   // Not yet created
        properties: '',        // Not yet created
        propertyTreeGraph: ptGraphATag,
        conceptGraph: cgGraphATag,
        coreNodesGraph: '',    // Self-referential — filled in below
      },
    },
  };

  const coreGraphEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', coreGraphDTag],
      ['name', coreGraphWord.word.name],
      ['z', configUuid('graph')],
      ['description', coreGraphWord.coreNodesGraph.description],
      ['json', JSON.stringify(coreGraphWord)],
    ],
    content: '',
  }, signerOpts);
  const coreGraphATag = `39999:${coreGraphEvent.pubkey}:${coreGraphDTag}`;
  await publishToStrfry(coreGraphEvent);
  allEvents.push(coreGraphEvent);

  log(`     ✅ ${coreGraphWord.word.name} → ${coreGraphATag}`);

  // ── 7. Update Core Nodes Graph & Concept Graph with final UUIDs ─
  log(`  📝 Step 7: Updating Core Nodes Graph and Concept Graph with final UUIDs`);

  // Core Nodes Graph: add self-reference UUID
  coreGraphWord.graph.nodes.push(
    { slug: `core-nodes-graph-for-the-concept-of-${slugPlural}`, uuid: coreGraphATag }
  );
  coreGraphWord.coreNodesGraph.constituents.coreNodesGraph = coreGraphATag;

  const coreGraphEventV2 = await signEvent({
    kind: 39999,
    tags: [
      ['d', coreGraphDTag],
      ['name', coreGraphWord.word.name],
      ['z', configUuid('graph')],
      ['description', coreGraphWord.coreNodesGraph.description],
      ['json', JSON.stringify(coreGraphWord)],
    ],
    content: '',
  }, signerOpts);
  await publishToStrfry(coreGraphEventV2);
  allEvents[allEvents.indexOf(coreGraphEvent)] = coreGraphEventV2;

  // Concept Graph: add core nodes graph import
  cgGraphWord.graph.imports.push(
    { slug: `core-nodes-graph-for-the-concept-of-${slugPlural}`, uuid: coreGraphATag }
  );

  const cgGraphEventV2 = await signEvent({
    kind: 39999,
    tags: [
      ['d', cgGraphDTag],
      ['name', cgGraphWord.word.name],
      ['z', configUuid('graph')],
      ['description', cgGraphWord.conceptGraph.description],
      ['json', JSON.stringify(cgGraphWord)],
    ],
    content: '',
  }, signerOpts);
  await publishToStrfry(cgGraphEventV2);
  allEvents[allEvents.indexOf(cgGraphEvent)] = cgGraphEventV2;

  log(`     ✅ Core Nodes Graph and Concept Graph updated with final UUIDs`);

  // ── 8. Relationship events (wiring) ─────────────────────────────
  log(`  📝 Step 8: Creating relationship events (wiring)`);

  const relEvents = [];
  const relDefs = [
    { from: headerATag, to: supersetATag, type: 'IS_THE_CONCEPT_FOR', name: `${name} IS_THE_CONCEPT_FOR ${supersetWord.word.name}` },
    { from: schemaATag, to: headerATag, type: 'IS_THE_JSON_SCHEMA_FOR', name: `${schemaWord.word.name} IS_THE_JSON_SCHEMA_FOR ${name}` },
    { from: coreGraphATag, to: headerATag, type: 'IS_THE_CORE_GRAPH_FOR', name: `${coreGraphWord.word.name} IS_THE_CORE_GRAPH_FOR ${name}` },
    { from: cgGraphATag, to: headerATag, type: 'IS_THE_CONCEPT_GRAPH_FOR', name: `${cgGraphWord.word.name} IS_THE_CONCEPT_GRAPH_FOR ${name}` },
    { from: ptGraphATag, to: headerATag, type: 'IS_THE_PROPERTY_TREE_GRAPH_FOR', name: `${ptGraphWord.word.name} IS_THE_PROPERTY_TREE_GRAPH_FOR ${name}` },
  ];

  for (const rel of relDefs) {
    const relDTag = randomDTag();
    const relEvent = await signEvent({
      kind: 39999,
      tags: [
        ['d', relDTag],
        ['name', rel.name],
        ['z', configUuid('relationship')],
        ['nodeFrom', rel.from],
        ['nodeTo', rel.to],
        ['relationshipType', rel.type],
      ],
      content: '',
    }, signerOpts);
    await publishToStrfry(relEvent);
    allEvents.push(relEvent);
    relEvents.push({ event: relEvent, aTag: `39999:${relEvent.pubkey}:${relDTag}` });

    log(`     ✅ ${rel.type}`);
  }

  // ── 9. Import all events to Neo4j in one batch ──────────────────
  if (!skipImport) {
    log(`\n  📊 Importing ${allEvents.length} events to Neo4j...`);
    await importToNeo4j(allEvents, { quiet: true });
    log(`  ✅ All ${allEvents.length} events imported to Neo4j`);
  }

  // ── Summary ─────────────────────────────────────────────────────
  const result = {
    header:            { event: headerEvent, aTag: headerATag },
    superset:          { event: supersetEvent, aTag: supersetATag },
    schema:            { event: schemaEvent, aTag: schemaATag },
    coreNodesGraph:    { event: coreGraphEventV2, aTag: coreGraphATag },
    conceptGraph:      { event: cgGraphEventV2, aTag: cgGraphATag },
    propertyTreeGraph: { event: ptGraphEvent, aTag: ptGraphATag },
    relationships:     relEvents,
  };

  log(`\n✨ Concept "${name}" created with ${allEvents.length} events!\n`);
  log(`  ConceptHeader:        ${headerATag}`);
  log(`  Superset:             ${supersetATag}`);
  log(`  JSON Schema:          ${schemaATag}`);
  log(`  Core Nodes Graph:     ${coreGraphATag}`);
  log(`  Concept Graph:        ${cgGraphATag}`);
  log(`  Property Tree Graph:  ${ptGraphATag}`);
  log(`  Relationship events:  ${relEvents.length}`);
  log('');

  return result;
}
