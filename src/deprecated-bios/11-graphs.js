#!/usr/bin/env node

/**
 * BIOS Script 11: Graphs
 * 
 * Creates the "graph" concept. Every concept skeleton includes 3 graph
 * instances (core nodes, concept graph, property tree), and each is an
 * element of this concept.
 * 
 * Graph nodes carry a `json` tag with a graph structure:
 *   { graph: { nodes: [...], relationshipTypes: [...], relationships: [...] } }
 * 
 * CLI equivalent:
 *   tapestry concept create "graph" --plural "graphs" --slug graph
 */

import { header, createConcept } from './helpers.js';

async function main() {
  header('BIOS 11: Graphs');

  await createConcept({
    name: 'graph',
    plural: 'graphs',
    description: 'A graph instance associated with a concept. Contains nodes, relationship types, and relationships as structured JSON.',
    slug: 'graph',
  });
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
