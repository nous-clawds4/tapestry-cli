#!/usr/bin/env node

/**
 * BIOS Script 08: Lists
 * 
 * Creates the "list" concept. A list is the user-facing term for a concept —
 * every ListHeader (kind 39998) is an element of this concept.
 * 
 * "list" and "concept" are essentially synonyms in the tapestry protocol,
 * but "list" emphasizes the nostr event structure (ListHeader + ListItems)
 * while "concept" emphasizes the semantic meaning.
 * 
 * CLI equivalent:
 *   tapestry concept create "list" --plural "lists" --slug list
 */

import { header, createConcept } from './helpers.js';

async function main() {
  header('BIOS 08: Lists');

  await createConcept({
    name: 'list',
    plural: 'lists',
    description: 'A named list (concept) in the tapestry protocol. Every kind 39998 ListHeader is an element of this concept.',
    slug: 'list',
  });
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
