#!/usr/bin/env node

/**
 * BIOS Script 02: Supersets
 * 
 * Creates the "superset" meta-concept — the concept whose elements are
 * all the Superset nodes in the graph. Every concept has exactly one Superset
 * that acts as the root of its class thread hierarchy.
 * 
 * This is the second bootstrap concept. Its own Superset ("the superset of
 * all supersets") is an element of itself — another self-referential loop
 * that the BIOS handles gracefully.
 * 
 * CLI equivalent:
 *   tapestry concept create "superset" --plural "supersets" \
 *     --description "..." --slug superset
 */

import { header, createConcept } from './helpers.js';

async function main() {
  header('BIOS 02: Supersets');

  await createConcept({
    name: 'superset',
    plural: 'supersets',
    description: 'The root node of a class thread hierarchy. Every concept has exactly one superset that contains all elements of that concept.',
    slug: 'superset',
  });
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
