#!/usr/bin/env node

/**
 * BIOS Script 10: Graph Types
 * 
 * Creates the "graph type" concept. Elements include:
 *   - Core Nodes Graph (infrastructure wiring for a concept)
 *   - Class Threads Graph (vertical: superset → sets → elements)
 *   - Property Tree Graph (horizontal: schema → properties)
 * 
 * The graph type elements will be created in a later pass.
 * 
 * CLI equivalent:
 *   tapestry concept create "graph type" --plural "graph types" --slug graphType
 */

import { header, createConcept } from './helpers.js';

async function main() {
  header('BIOS 10: Graph Types');

  await createConcept({
    name: 'graph type',
    plural: 'graph types',
    description: 'The types of graphs associated with each concept: core nodes, concept graph, and property tree.',
    slug: 'graphType',
  });
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
