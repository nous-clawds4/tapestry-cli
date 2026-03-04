#!/usr/bin/env node

/**
 * BIOS Script 06: Properties
 * 
 * Creates the "property" concept. Properties define the horizontal structure
 * of a concept — the fields that each element should have.
 * 
 * Properties live in the Property Tree Graph and connect to the JSON Schema
 * via IS_A_PROPERTY_OF. When a property's valid values come from another
 * concept, that's an ENUMERATES relationship (horizontal integration).
 * 
 * CLI equivalent:
 *   tapestry concept create "property" --plural "properties" --slug property
 */

import { header, createConcept } from './helpers.js';

async function main() {
  header('BIOS 06: Properties');

  await createConcept({
    name: 'property',
    plural: 'properties',
    description: 'A named field in a concept\'s JSON Schema. Properties define the horizontal structure of elements.',
    slug: 'property',
  });
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
