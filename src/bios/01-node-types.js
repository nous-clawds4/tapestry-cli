#!/usr/bin/env node

/**
 * BIOS Script 01: Node Types
 * 
 * Creates the "node type" meta-concept — the concept whose elements define
 * what kinds of nodes can exist in the concept graph.
 * 
 * This is the FIRST concept to create because it's the Class Thread Anomaly
 * (Rule 9): the one node that is an element of its own Superset.
 * 
 * What createConcept() creates (full skeleton):
 *   1. "node type" ListHeader / ConceptHeader (kind 39998)
 *   2. "the superset of all node types" Superset (kind 39999)
 *   3. "JSON schema for node type" JSONSchema (kind 39999)
 *   4. Core Nodes Graph (kind 39999)
 *   5. Class Threads Graph (kind 39999)
 *   6. Property Tree Graph (kind 39999)
 *   7. 5 relationship events wiring them together
 *   8. JSON tags on all 6 primary nodes
 * 
 * Total: 11 events
 * 
 * CLI equivalent:
 *   tapestry concept create "node type" --plural "node types" \
 *     --description "The types of nodes in the tapestry concept graph" \
 *     --slug nodeType
 * 
 * Note: The Superset's z-tag points to the canonical "superset" concept,
 * which will be created in script 02. This is the bootstrap problem —
 * every concept needs the superset concept to exist, but it doesn't yet.
 * The BIOS resolves this by creating all concepts first, then normalizing.
 */

import { header, createConcept } from './helpers.js';

async function main() {
  header('BIOS 01: Node Types');

  const result = await createConcept({
    name: 'node type',
    plural: 'node types',
    description: 'The types of nodes in the tapestry concept graph. Elements include: superset, set, property, JSON schema, relationship, and more.',
    slug: 'nodeType',
  });

  console.log('  Note: This is the Class Thread Anomaly — the node type');
  console.log('  concept is itself an element of its own Superset.');
  console.log('');
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
