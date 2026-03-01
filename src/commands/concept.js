/**
 * tapestry concept — create and manage concepts (list headers and items)
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { signEvent } from '../lib/signer.js';
import { addItemCommand } from './concept-add.js';
import { linkCommand } from './concept-link.js';
import { elementCommand } from './concept-element.js';
import { enumerateCommand } from './concept-enumerate.js';

const execAsync = promisify(execCb);
const CONTAINER = 'tapestry-tapestry-1';

export function conceptCommand(program) {
  const concept = program
    .command('concept')
    .description('Create and manage tapestry concepts');

  concept
    .command('create <name>')
    .description('Create a new concept (kind 39998 list header)')
    .option('--plural <name>', 'Plural form of the concept name')
    .option('--description <text>', 'Description of the concept')
    .option('--d-tag <id>', 'Custom d-tag (default: random 8-char hex)')
    .option('--publish', 'Also publish to remote relays')
    .option('--personal', 'Sign with personal nsec from 1Password instead of Tapestry Assistant')
    .option('--no-import', 'Skip Neo4j import after creating')
    .action(async (name, opts) => {
      await createConcept(name, opts);
    });

  addItemCommand(concept);
  linkCommand(concept);
  elementCommand(concept);
  enumerateCommand(concept);

  concept
    .command('list')
    .description('List all concepts in the graph')
    .action(async () => {
      await listConcepts();
    });
}

async function createConcept(name, opts) {
  console.log(`\n🧵 Creating concept: "${name}"\n`);

  // Generate d-tag
  const dTag = opts.dTag || randomBytes(4).toString('hex');

  // Build tags
  const tags = [
    ['d', dTag],
    ['names', name, opts.plural || name + 's'],
  ];

  if (opts.description) {
    tags.push(['description', opts.description]);
  }

  // Sign the event
  console.log('  📝 Building kind 39998 event...');
  let event;
  try {
    event = await signEvent({
      kind: 39998,
      tags,
      content: '',
    }, { personal: opts.personal });
  } catch (err) {
    console.error(`  ❌ Signing failed: ${err.message}`);
    process.exit(1);
  }

  console.log(`  ✅ Signed by ${event._signerLabel} (${event.pubkey.slice(0, 12)}...)`);
  console.log(`     d-tag:   ${dTag}`);
  console.log(`     a-tag:   39998:${event.pubkey}:${dTag}`);
  console.log(`     Names:   ${name} / ${opts.plural || name + 's'}`);
  if (opts.description) console.log(`     Desc:    ${opts.description}`);

  // Write to local strfry
  console.log('\n  📡 Importing to local strfry...');
  try {
    const eventJson = JSON.stringify(event);
    // Pipe the event into strfry import inside the container
    const cmd = `echo '${eventJson.replace(/'/g, "'\\''")}' | docker exec -i ${CONTAINER} strfry import 2>&1`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
    const output = (stdout || '') + (stderr || '');
    // Parse the summary line: "1 added, 0 rejected, 0 dups"
    const summaryMatch = output.match(/(\d+) added, (\d+) rejected, (\d+) dups/);
    if (summaryMatch) {
      const [, added, rejected, dups] = summaryMatch;
      if (parseInt(rejected) > 0) {
        console.log(`  ⚠️  ${added} added, ${rejected} rejected, ${dups} dups`);
      } else if (parseInt(dups) > 0) {
        console.log(`  ℹ️  Event already exists in strfry (duplicate)`);
      } else {
        console.log(`  ✅ Event written to strfry`);
      }
    } else {
      console.log(`  ✅ Event sent to strfry`);
    }
  } catch (err) {
    console.error(`  ❌ strfry import failed: ${err.message}`);
    process.exit(1);
  }

  // Publish to remote relays
  if (opts.publish) {
    console.log('\n  🌐 Publishing to remote relays...');
    const relays = [
      'wss://dcosl.brainstorm.world',
      'wss://dcosl.brainstorm.social/relay',
    ];
    for (const relay of relays) {
      try {
        const eventJson = JSON.stringify(['EVENT', event]);
        // Use websocat or a simple node script to publish
        // For now, use strfry's built-in sync to push
        const cmd = `docker exec ${CONTAINER} strfry sync ${relay} --filter '{"ids":["${event.id}"]}' --dir up 2>&1`;
        const { stdout } = await execAsync(cmd, { timeout: 30000 });
        if (stdout.includes('Have')) {
          console.log(`     ✅ ${relay}`);
        } else {
          console.log(`     ✅ ${relay} (sent)`);
        }
      } catch (err) {
        console.log(`     ❌ ${relay}: ${err.message.split('\n').pop()}`);
      }
    }
  }

  // Import into Neo4j
  if (opts.import !== false) {
    console.log('\n  📊 Importing into Neo4j...');
    try {
      const { stdout } = await execAsync(
        `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/batchTransfer.sh`,
        { timeout: 120000 }
      );
      const eventMatch = stdout.match(/Found (\d+) events/);
      const tagMatch = stdout.match(/Created (\d+) tag objects/);
      console.log(`  ✅ ${eventMatch?.[1] || '?'} events → ${tagMatch?.[1] || '?'} tags`);

      // Run setup.sh to add labels (ListHeader/ListItem) and concept relationships
      console.log('  🏷️  Labeling nodes and creating relationships...');
      await execAsync(
        `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/setup.sh`,
        { timeout: 60000 }
      );
      console.log('  ✅ Labels and relationships applied');
    } catch (err) {
      console.error(`  ❌ Import failed: ${err.message}`);
    }
  }

  console.log(`\n✨ Concept "${name}" created!\n`);
  console.log(`To add items: tapestry concept add "${name}" "<item name>"`);
  console.log('');
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
