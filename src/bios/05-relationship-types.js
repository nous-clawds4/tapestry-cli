#!/usr/bin/env node

/**
 * BIOS Script 05: Relationship Types
 * 
 * Creates the "relationship type" concept. Elements include:
 *   IS_THE_CONCEPT_FOR, IS_A_SUPERSET_OF, HAS_ELEMENT,
 *   IS_A_PROPERTY_OF, IS_THE_JSON_SCHEMA_FOR, ENUMERATES,
 *   IS_THE_CORE_GRAPH_FOR, IS_THE_CONCEPT_GRAPH_FOR,
 *   IS_THE_PROPERTY_TREE_GRAPH_FOR, etc.
 * 
 * The actual relationship type elements will be created in a later pass.
 * 
 * CLI equivalent:
 *   tapestry concept create "relationship type" --plural "relationship types" \
 *     --slug relationshipType
 */

import { header, createConcept } from './helpers.js';

async function main() {
  header('BIOS 05: Relationship Types');

  await createConcept({
    name: 'relationship type',
    plural: 'relationship types',
    description: 'The types of directed relationships that can exist between nodes in the concept graph.',
    slug: 'relationshipType',
  });
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
