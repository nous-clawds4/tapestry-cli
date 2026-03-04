/**
 * Concept creation library.
 *
 * createConcept() creates the full skeleton for a new concept:
 *
 *   1. ListHeader / ClassThreadHeader (kind 39998)
 *   2. Superset (kind 39999, z → uuid.superset)
 *   3. JSON Schema (kind 39999, z → uuid.jsonSchema)
 *   4. Core Nodes Graph (kind 39999, z → uuid.graph)
 *   5. Class Threads Graph (kind 39999, z → uuid.graph)
 *   6. Property Tree Graph (kind 39999, z → uuid.graph)
 *
 * Plus wiring (both as Neo4j relationships and as explicit relationship events
 * recorded in the Core Nodes Graph's json tag):
 *
 *   - ClassThreadHeader → IS_THE_CONCEPT_FOR → Superset
 *   - JSON Schema → IS_THE_JSON_SCHEMA_FOR → ClassThreadHeader
 *   - Core Nodes Graph → IS_THE_CORE_GRAPH_FOR → ClassThreadHeader
 *   - Class Threads Graph → IS_THE_CLASS_THREADS_GRAPH_FOR → ClassThreadHeader
 *   - Property Tree Graph → IS_THE_PROPERTY_TREE_GRAPH_FOR → ClassThreadHeader
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

/**
 * Derive a camelCase slug from a concept name.
 * "JSON data type" → "jsonDataType", "dog" → "dog"
 */
function deriveSlug(name) {
  const words = name.split(/\s+/);
  return words.map((w, i) => {
    const lower = w.toLowerCase();
    if (i === 0) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join('');
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
 * @param {string} opts.name - Singular name (e.g. "dog")
 * @param {string} opts.plural - Plural name (e.g. "dogs")
 * @param {string} [opts.description] - Concept description
 * @param {string} [opts.slug] - Explicit slug (default: derived from name)
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
 *   classThreadsGraph: { event, aTag },
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

  const slug = opts.slug || deriveSlug(name);
  const log = quiet ? () => {} : console.log;
  const signerOpts = { personal };

  // We'll collect all events and import them in one batch at the end
  const allEvents = [];

  // ── 1. ListHeader (kind 39998) ──────────────────────────────────
  log(`\n🧵 Creating concept: "${name}"\n`);
  log(`  📝 Step 1: ListHeader`);

  const headerDTag = dTag || randomDTag();

  // We'll build the header JSON after we know all constituent UUIDs (step 7b).
  // For now, create without json tag — it gets re-signed at the end.
  const headerTags = [
    ['d', headerDTag],
    ['names', name, plural],
    ['slug', slug],
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
  const supersetName = `the superset of all ${plural}`;
  const supersetJson = JSON.stringify({
    supersetOf: name,
    role: 'superset',
    description: `The superset node for the ${name} concept. All ${plural} are elements of this set.`,
  });
  const supersetEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', supersetDTag],
      ['name', supersetName],
      ['z', configUuid('superset')],
      ['description', `The superset node for the ${name} concept.`],
      ['json', supersetJson],
    ],
    content: '',
  }, signerOpts);
  const supersetATag = `39999:${supersetEvent.pubkey}:${supersetDTag}`;
  await publishToStrfry(supersetEvent);
  allEvents.push(supersetEvent);

  log(`     ✅ ${supersetName} → ${supersetATag}`);

  // ── 3. JSON Schema (kind 39999) ─────────────────────────────────
  log(`  📝 Step 3: JSON Schema`);

  const schemaDTag = `${slug}-schema`;
  const schemaName = `JSON schema for ${name}`;
  const schemaJson = JSON.stringify({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    title: name,
    description: `JSON Schema for ${name}`,
    properties: {},
    required: [],
  });
  const schemaEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', schemaDTag],
      ['name', schemaName],
      ['z', configUuid('jsonSchema')],
      ['description', `The JSON Schema defining the horizontal structure of the ${name} concept.`],
      ['json', schemaJson],
    ],
    content: '',
  }, signerOpts);
  const schemaATag = `39999:${schemaEvent.pubkey}:${schemaDTag}`;
  await publishToStrfry(schemaEvent);
  allEvents.push(schemaEvent);

  log(`     ✅ ${schemaName} → ${schemaATag}`);

  // ── 4. Core Nodes Graph (kind 39999) ────────────────────────────
  log(`  📝 Step 4: Core Nodes Graph`);

  const coreGraphDTag = `${slug}-core-nodes-graph`;
  const coreGraphName = `core nodes graph for the ${name} concept`;

  // Build the graph JSON that describes all 6 core nodes and their wiring
  const graphNodes = [
    { slug: `${slug}_header`, uuid: headerATag, name: name },
    { slug: `${slug}_superset`, uuid: supersetATag, name: supersetName },
    { slug: `${slug}_schema`, uuid: schemaATag, name: schemaName },
    { slug: `${slug}_coreNodesGraph`, uuid: `placeholder:coreNodesGraph`, name: coreGraphName },
    { slug: `${slug}_classThreadsGraph`, uuid: `placeholder:classThreadsGraph`, name: `class threads graph for the ${name} concept` },
    { slug: `${slug}_propertyTreeGraph`, uuid: `placeholder:propertyTreeGraph`, name: `property tree graph for the ${name} concept` },
  ];

  const graphRelTypes = [
    { slug: 'IS_THE_CONCEPT_FOR', name: 'class thread initiation' },
    { slug: 'IS_THE_JSON_SCHEMA_FOR', name: 'is the JSON schema for' },
    { slug: 'IS_THE_CORE_GRAPH_FOR', name: 'IS_THE_CORE_GRAPH_FOR' },
    { slug: 'IS_THE_CLASS_THREADS_GRAPH_FOR', name: 'IS_THE_CLASS_THREADS_GRAPH_FOR' },
    { slug: 'IS_THE_PROPERTY_TREE_GRAPH_FOR', name: 'IS_THE_PROPERTY_TREE_GRAPH_FOR' },
  ];

  const graphRelationships = [
    { nodeFrom: { slug: `${slug}_header` }, relationshipType: { slug: 'IS_THE_CONCEPT_FOR' }, nodeTo: { slug: `${slug}_superset` } },
    { nodeFrom: { slug: `${slug}_schema` }, relationshipType: { slug: 'IS_THE_JSON_SCHEMA_FOR' }, nodeTo: { slug: `${slug}_header` } },
    { nodeFrom: { slug: `${slug}_coreNodesGraph` }, relationshipType: { slug: 'IS_THE_CORE_GRAPH_FOR' }, nodeTo: { slug: `${slug}_header` } },
    { nodeFrom: { slug: `${slug}_classThreadsGraph` }, relationshipType: { slug: 'IS_THE_CLASS_THREADS_GRAPH_FOR' }, nodeTo: { slug: `${slug}_header` } },
    { nodeFrom: { slug: `${slug}_propertyTreeGraph` }, relationshipType: { slug: 'IS_THE_PROPERTY_TREE_GRAPH_FOR' }, nodeTo: { slug: `${slug}_header` } },
  ];

  const graphSubgraphs = [
    { slug: `${slug}_classThreadsGraph`, name: `class threads graph for the ${name} concept` },
    { slug: `${slug}_propertyTreeGraph`, name: `property tree graph for the ${name} concept` },
  ];

  // We'll finalize the graph JSON after creating all graph nodes (to fill in UUIDs)
  const coreGraphEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', coreGraphDTag],
      ['name', coreGraphName],
      ['z', configUuid('graph')],
      ['description', `Core infrastructure nodes for ${name}: header, superset, schema, and three canonical graphs.`],
      // json tag will be set after we know all UUIDs — see below
    ],
    content: '',
  }, signerOpts);
  const coreGraphATag = `39999:${coreGraphEvent.pubkey}:${coreGraphDTag}`;
  await publishToStrfry(coreGraphEvent);
  allEvents.push(coreGraphEvent);

  log(`     ✅ ${coreGraphName} → ${coreGraphATag}`);

  // ── 5. Class Threads Graph (kind 39999) ─────────────────────────
  log(`  📝 Step 5: Class Threads Graph`);

  const ctGraphDTag = `${slug}-class-threads-graph`;
  const ctGraphName = `class threads graph for the ${name} concept`;
  const ctGraphJson = JSON.stringify({
    graph: {
      nodes: [
        { slug: `${slug}_superset`, uuid: supersetATag, name: supersetName },
      ],
      relationshipTypes: [
        { slug: 'IS_A_SUPERSET_OF', name: 'class thread propagation' },
        { slug: 'HAS_ELEMENT', name: 'class thread termination' },
      ],
      relationships: [],
    },
  });
  const ctGraphEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', ctGraphDTag],
      ['name', ctGraphName],
      ['z', configUuid('graph')],
      ['description', `Class thread graph for ${name}: superset hierarchy and elements.`],
      ['json', ctGraphJson],
    ],
    content: '',
  }, signerOpts);
  const ctGraphATag = `39999:${ctGraphEvent.pubkey}:${ctGraphDTag}`;
  await publishToStrfry(ctGraphEvent);
  allEvents.push(ctGraphEvent);

  log(`     ✅ ${ctGraphName} → ${ctGraphATag}`);

  // ── 6. Property Tree Graph (kind 39999) ─────────────────────────
  log(`  📝 Step 6: Property Tree Graph`);

  const ptGraphDTag = `${slug}-property-tree-graph`;
  const ptGraphName = `property tree graph for the ${name} concept`;
  const ptGraphJson = JSON.stringify({
    graph: {
      nodes: [
        { slug: `${slug}_schema`, uuid: schemaATag, name: schemaName },
      ],
      relationshipTypes: [
        { slug: 'IS_A_PROPERTY_OF', name: 'is a property of' },
        { slug: 'ENUMERATES', name: 'enumerates' },
      ],
      relationships: [],
    },
  });
  const ptGraphEvent = await signEvent({
    kind: 39999,
    tags: [
      ['d', ptGraphDTag],
      ['name', ptGraphName],
      ['z', configUuid('graph')],
      ['description', `Property tree graph for ${name}: schema and properties.`],
      ['json', ptGraphJson],
    ],
    content: '',
  }, signerOpts);
  const ptGraphATag = `39999:${ptGraphEvent.pubkey}:${ptGraphDTag}`;
  await publishToStrfry(ptGraphEvent);
  allEvents.push(ptGraphEvent);

  log(`     ✅ ${ptGraphName} → ${ptGraphATag}`);

  // ── Now update the Core Nodes Graph with the complete JSON ──────
  // We need to re-publish the core graph event with the json tag filled in,
  // now that we know all UUIDs.
  log(`  📝 Step 7: Updating Core Nodes Graph with full JSON`);

  // Fill in the placeholder UUIDs
  graphNodes[3].uuid = coreGraphATag;
  graphNodes[4].uuid = ctGraphATag;
  graphNodes[5].uuid = ptGraphATag;

  // Also add UUIDs to subgraphs
  graphSubgraphs[0].uuid = ctGraphATag;
  graphSubgraphs[1].uuid = ptGraphATag;

  const graphJson = {
    graph: {
      nodes: graphNodes,
      relationshipTypes: graphRelTypes,
      relationships: graphRelationships,
      subgraphs: graphSubgraphs,
    },
  };

  const coreGraphEventV2 = await signEvent({
    kind: 39999,
    tags: [
      ['d', coreGraphDTag],
      ['name', coreGraphName],
      ['z', configUuid('graph')],
      ['description', `Core infrastructure nodes for ${name}: header, superset, schema, and three canonical graphs.`],
      ['json', JSON.stringify(graphJson)],
    ],
    content: '',
  }, signerOpts);
  await publishToStrfry(coreGraphEventV2);
  // Replace the original in allEvents
  allEvents[allEvents.indexOf(coreGraphEvent)] = coreGraphEventV2;

  log(`     ✅ Core Nodes Graph JSON updated`);

  // ── 7b. Update ListHeader with constituent UUIDs in JSON ────────
  log(`  📝 Step 7b: Updating ListHeader with constituent JSON`);

  const headerJson = JSON.stringify({
    concept: {
      name,
      plural,
      slug,
      constituents: {
        superset: supersetATag,
        jsonSchema: schemaATag,
        coreNodesGraph: coreGraphATag,
        classThreadsGraph: ctGraphATag,
        propertyTreeGraph: ptGraphATag,
      },
    },
  });

  const headerTagsV2 = [
    ['d', headerDTag],
    ['names', name, plural],
    ['slug', slug],
    ['json', headerJson],
  ];
  if (description) headerTagsV2.push(['description', description]);

  const headerEventV2 = await signEvent({ kind: 39998, tags: headerTagsV2, content: '' }, signerOpts);
  await publishToStrfry(headerEventV2);
  allEvents[allEvents.indexOf(headerEvent)] = headerEventV2;

  log(`     ✅ ListHeader JSON updated`);

  // ── 8. Relationship events (wiring) ─────────────────────────────
  log(`  📝 Step 8: Creating relationship events (wiring)`);

  const relEvents = [];
  const relDefs = [
    { from: headerATag, to: supersetATag, type: 'IS_THE_CONCEPT_FOR', name: `${name} IS_THE_CONCEPT_FOR ${supersetName}` },
    { from: schemaATag, to: headerATag, type: 'IS_THE_JSON_SCHEMA_FOR', name: `${schemaName} IS_THE_JSON_SCHEMA_FOR ${name}` },
    { from: coreGraphATag, to: headerATag, type: 'IS_THE_CORE_GRAPH_FOR', name: `${coreGraphName} IS_THE_CORE_GRAPH_FOR ${name}` },
    { from: ctGraphATag, to: headerATag, type: 'IS_THE_CLASS_THREADS_GRAPH_FOR', name: `${ctGraphName} IS_THE_CLASS_THREADS_GRAPH_FOR ${name}` },
    { from: ptGraphATag, to: headerATag, type: 'IS_THE_PROPERTY_TREE_GRAPH_FOR', name: `${ptGraphName} IS_THE_PROPERTY_TREE_GRAPH_FOR ${name}` },
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
    header:            { event: headerEventV2, aTag: headerATag },
    superset:          { event: supersetEvent, aTag: supersetATag },
    schema:            { event: schemaEvent, aTag: schemaATag },
    coreNodesGraph:    { event: coreGraphEventV2, aTag: coreGraphATag },
    classThreadsGraph: { event: ctGraphEvent, aTag: ctGraphATag },
    propertyTreeGraph: { event: ptGraphEvent, aTag: ptGraphATag },
    relationships:     relEvents,
  };

  log(`\n✨ Concept "${name}" created with ${allEvents.length} events!\n`);
  log(`  ClassThreadHeader:    ${headerATag}`);
  log(`  Superset:             ${supersetATag}`);
  log(`  JSON Schema:          ${schemaATag}`);
  log(`  Core Nodes Graph:     ${coreGraphATag}`);
  log(`  Class Threads Graph:  ${ctGraphATag}`);
  log(`  Property Tree Graph:  ${ptGraphATag}`);
  log(`  Relationship events:  ${relEvents.length}`);
  log('');

  return result;
}
