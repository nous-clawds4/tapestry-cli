#!/usr/bin/env node

/**
 * BIOS Script 07: JSON Schemas
 * 
 * Creates the "JSON schema" concept. Each concept has one active JSON Schema
 * that defines the structure of its elements (Rule 11).
 * 
 * The JSON Schema node sits at the root of the Property Tree Graph and is
 * wired to the ClassThreadHeader via IS_THE_JSON_SCHEMA_FOR.
 * 
 * CLI equivalent:
 *   tapestry concept create "JSON schema" --plural "JSON schemas" --slug jsonSchema
 */

import { header, createConcept } from './helpers.js';

async function main() {
  header('BIOS 07: JSON Schemas');

  await createConcept({
    name: 'JSON schema',
    plural: 'JSON schemas',
    description: 'A JSON Schema defining the horizontal structure of a concept. Each concept has exactly one active schema (Rule 11).',
    slug: 'jsonSchema',
  });
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
