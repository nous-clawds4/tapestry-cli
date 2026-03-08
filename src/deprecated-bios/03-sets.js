#!/usr/bin/env node

/**
 * BIOS Script 03: Sets
 * 
 * Creates the "set" concept. Sets are intermediate nodes in class threads —
 * they sit between the Superset and the Elements, creating subgroups.
 * 
 * Class thread structure:
 *   Superset ──IS_A_SUPERSET_OF──→ Set ──IS_A_SUPERSET_OF──→ ... ──HAS_ELEMENT──→ Element
 * 
 * CLI equivalent:
 *   tapestry concept create "set" --plural "sets" --slug set
 */

import { header, createConcept } from './helpers.js';

async function main() {
  header('BIOS 03: Sets');

  await createConcept({
    name: 'set',
    plural: 'sets',
    description: 'An intermediate grouping node in a class thread hierarchy. Sets subdivide the superset into smaller categories.',
    slug: 'set',
  });
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
