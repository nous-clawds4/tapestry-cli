/**
 * tapestry concept — create and manage concepts (list headers and items)
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { signEvent } from '../lib/signer.js';
import { importToNeo4j } from '../lib/neo4j.js';
import { getConfig } from '../lib/config.js';
import { createConcept as createFullConcept } from '../lib/concept.js';
import { addItemCommand } from './concept-add.js';
import { linkCommand } from './concept-link.js';
import { elementCommand } from './concept-element.js';
import { enumerateCommand } from './concept-enumerate.js';
import { schemaCommand } from './concept-schema.js';
import { slugCommand } from './concept-slug.js';

const execAsync = promisify(execCb);

export function conceptCommand(program) {
  const concept = program
    .command('concept')
    .description('Create and manage tapestry concepts');

  concept
    .command('create <name>')
    .description('Create a new concept with full skeleton (header, superset, schema, 3 graphs, wiring)')
    .option('--plural <name>', 'Plural form of the concept name')
    .option('--description <text>', 'Description of the concept')
    .option('--slug <slug>', 'Override kebab-case slug (default: derived from name)')
    .option('--key <key>', 'Override camelCase key (default: derived from name)')
    .option('--d-tag <id>', 'Custom d-tag for the ListHeader (default: random 8-char hex)')
    .option('--publish', 'Also publish to remote relays')
    .option('--personal', 'Sign with personal nsec from 1Password instead of Tapestry Assistant')
    .option('--no-import', 'Skip Neo4j import after creating')
    .action(async (name, opts) => {
      try {
        await createFullConcept({
          name,
          plural: opts.plural,
          description: opts.description,
          slug: opts.slug,
          key: opts.key,
          dTag: opts.dTag,
          personal: opts.personal,
          skipImport: opts.import === false,
        });
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });

  addItemCommand(concept);
  linkCommand(concept);
  elementCommand(concept);
  enumerateCommand(concept);
  schemaCommand(concept);
  slugCommand(concept);

  concept
    .command('list')
    .description('List all concepts in the graph')
    .action(async () => {
      await listConcepts();
    });
}

async function listConcepts() {
  const { apiGet } = await import('../lib/api.js');
  try {
    const cypher = encodeURIComponent(
      "MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) " +
      "OPTIONAL MATCH (i:ListItem)-[:HAS_TAG]->(z:NostrEventTag {type: 'z'}), " +
      "(h)-[:HAS_TAG]->(a:NostrEventTag {type: 'd'}) " +
      "WHERE z.value ENDS WITH a.value " +
      "RETURN t.value AS concept, t.value1 AS plural, count(DISTINCT i) AS items " +
      "ORDER BY concept"
    );
    const data = await apiGet(`/api/neo4j/run-query?cypher=${cypher}`);

    if (!data.success) {
      console.error(`❌ ${data.error}`);
      process.exit(1);
    }

    const raw = (data.cypherResults || '').trim();
    if (!raw) {
      console.log('No concepts found.');
      return;
    }

    const lines = raw.split('\n');
    console.log(`\n🧵 Concepts (${lines.length - 1}):\n`);
    for (let i = 1; i < lines.length; i++) {
      // Parse CSV-ish output: "concept", "plural", count
      const line = lines[i];
      console.log(`  ${line}`);
    }
    console.log('');
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}
