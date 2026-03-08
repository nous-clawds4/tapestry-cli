#!/usr/bin/env node

/**
 * BIOS Script 04: Relationships
 * 
 * Creates the "relationship" concept. Relationship instances are recorded
 * as kind 39999 events with nodeFrom, nodeTo, and relationshipType tags.
 * They are also stored as direct Neo4j relationships for query performance.
 * 
 * CLI equivalent:
 *   tapestry concept create "relationship" --plural "relationships" --slug relationship
 */

import { header, createConcept } from './helpers.js';

async function main() {
  header('BIOS 04: Relationships');

  await createConcept({
    name: 'relationship',
    plural: 'relationships',
    description: 'An explicit directed relationship between two nodes, recorded both as a nostr event and as a Neo4j edge.',
    slug: 'relationship',
  });
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
