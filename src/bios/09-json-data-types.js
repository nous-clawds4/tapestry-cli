#!/usr/bin/env node

/**
 * BIOS Script 09: JSON Data Types
 * 
 * Creates the "JSON data type" concept AND its 7 elements:
 *   string, number, integer, boolean, object, array, null
 * 
 * This is the first BIOS script that creates elements (not just the skeleton),
 * because the JSON data types are fundamental to the property system — every
 * property has a "type" field whose valid values are enumerated by this concept.
 * 
 * Later (Pass 3), this concept will ENUMERATE the "type" property
 * of the "property" concept via horizontal integration.
 * 
 * CLI equivalent:
 *   tapestry concept create "JSON data type" --plural "JSON data types" --slug jsonDataType
 *   tapestry concept add "JSON data type" "string" --description "A sequence of characters (text)"
 *   tapestry concept add "JSON data type" "number" --description "..."
 *   ... etc
 */

import { header, createConcept, createItem } from './helpers.js';

const JSON_DATA_TYPES = [
  { name: 'string',  description: 'A sequence of characters (text)' },
  { name: 'number',  description: 'Any numeric value (integer or floating point)' },
  { name: 'integer', description: 'A whole number (no fractional part)' },
  { name: 'boolean', description: 'A true or false value' },
  { name: 'object',  description: 'A collection of key-value pairs (JSON object)' },
  { name: 'array',   description: 'An ordered list of values' },
  { name: 'null',    description: 'An explicitly empty value' },
];

async function main() {
  header('BIOS 09: JSON Data Types');

  // Step 1: Create the full concept skeleton (11 events)
  const result = await createConcept({
    name: 'JSON data type',
    plural: 'JSON data types',
    description: 'The seven primitive data types in JSON Schema: string, number, integer, boolean, object, array, null.',
    slug: 'jsonDataType',
  });

  // Step 2: Create the 7 JSON data type elements
  //
  // Each is a kind 39999 event with z-tag pointing to the JSON data type
  // concept's ListHeader. These are actual elements — the first concrete
  // data in the BIOS.
  //
  // CLI equivalent for each:
  //   tapestry concept add "JSON data type" "string" --description "..."

  console.log(`\n── Creating ${JSON_DATA_TYPES.length} data type elements ──\n`);

  for (const dt of JSON_DATA_TYPES) {
    await createItem({
      name: dt.name,
      concept: 'JSON data type',
      description: dt.description,
    });
  }

  console.log(`\n  ✅ ${JSON_DATA_TYPES.length} elements created: ${JSON_DATA_TYPES.map(d => d.name).join(', ')}`);
  console.log('');
}

main().catch(err => { console.error(`\n❌ ${err.message}\n`); process.exit(1); });
