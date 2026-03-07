/**
 * tapestry concept — create and manage concepts (list headers and items)
 *
 * Thin client: all logic lives in the Tapestry server API.
 */

import { apiGet, apiPost } from '../lib/api.js';
import { addItemCommand } from './concept-add.js';
import { linkCommand } from './concept-link.js';
import { elementCommand } from './concept-element.js';
import { enumerateCommand } from './concept-enumerate.js';
import { schemaCommand } from './concept-schema.js';
import { slugCommand } from './concept-slug.js';

export function conceptCommand(program) {
  const concept = program
    .command('concept')
    .description('Create and manage tapestry concepts');

  concept
    .command('create <name>')
    .description('Create a new concept with full skeleton (header, superset, schema, 3 graphs, wiring)')
    .option('--plural <name>', 'Plural form of the concept name')
    .option('--description <text>', 'Description of the concept')
    .action(async (name, opts) => {
      try {
        const result = await apiPost('/api/normalize/create-concept', {
          name,
          plural: opts.plural,
          description: opts.description,
        });

        if (!result.success) {
          console.error(`\n❌ ${result.error}\n`);
          process.exit(1);
        }

        const c = result.concept;
        console.log(`\n✅ ${result.message}`);
        console.log(`\n  Header:         ${c.uuid}`);
        console.log(`  Superset:       ${c.superset}`);
        console.log(`  JSON Schema:    ${c.schema}`);
        console.log(`  Core Graph:     ${c.coreGraph}`);
        console.log(`  Concept Graph:  ${c.conceptGraph}`);
        console.log(`  Property Tree:  ${c.propGraph}`);
        console.log('');
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
      console.log(`  ${lines[i]}`);
    }
    console.log('');
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}
