/**
 * tapestry query — run Cypher queries against the Neo4j concept graph
 */

import { apiGet } from '../lib/api.js';

// Built-in shortcut queries
const SHORTCUTS = {
  concepts: {
    desc: 'List all concept list headers',
    cypher: `MATCH (h:ListHeader)-[:HAS_TAG]->(t {tagName: 'names'}) RETURN t.tagValue AS name, h.dTag AS dTag, substring(h.pubkey, 0, 12) + '...' AS author ORDER BY name`,
  },
  items: {
    desc: 'List all list items with types',
    cypher: `MATCH (i:ListItem)-[:HAS_TAG]->(t {tagName: 'name'}) RETURN t.tagValue AS name, i.dTag AS dTag, CASE WHEN i:Superset THEN 'Superset' WHEN i:Property THEN 'Property' WHEN i:JSONSchema THEN 'JSONSchema' WHEN i:Relationship THEN 'Relationship' ELSE 'Item' END AS type ORDER BY type, name`,
  },
  graph: {
    desc: 'Show concept graph relationships',
    cypher: `MATCH (a)-[r]->(b) WHERE NOT type(r) IN ['HAS_TAG'] AND (a:ListHeader OR a:ListItem) AND (b:ListHeader OR b:ListItem) RETURN a.dTag AS from_node, type(r) AS rel, b.dTag AS to_node ORDER BY type(r), a.dTag`,
  },
  users: {
    desc: 'List nostr users in the graph',
    cypher: `MATCH (u:NostrUser) RETURN substring(u.pubkey, 0, 16) + '...' AS pubkey ORDER BY pubkey`,
  },
  counts: {
    desc: 'Count nodes by label',
    cypher: `MATCH (n) RETURN labels(n) AS labels, count(n) AS count ORDER BY count DESC`,
  },
  supersets: {
    desc: 'Show superset hierarchy',
    cypher: `MATCH (a)-[:IS_A_SUPERSET_OF]->(b) RETURN a.dTag AS parent, b.dTag AS child ORDER BY parent`,
  },
};

export function queryCommand(program) {
  program
    .command('query [words...]')
    .description('Run a Cypher query or shortcut against the concept graph')
    .option('--raw', 'Output raw JSON')
    .option('--shortcuts', 'List available shortcuts')
    .action(async (words, opts) => {
      if (opts.shortcuts) {
        console.log('\n📋 Query shortcuts:\n');
        for (const [name, s] of Object.entries(SHORTCUTS)) {
          console.log(`  tapestry query ${name}  — ${s.desc}`);
        }
        console.log('');
        return;
      }

      const input = (words || []).join(' ').trim();
      if (!input) {
        console.log('Usage: tapestry query <cypher | shortcut>');
        console.log('       tapestry query --shortcuts\n');
        console.log('Examples:');
        console.log('  tapestry query concepts');
        console.log('  tapestry query counts');
        console.log('  tapestry query "MATCH (n) RETURN count(n)"');
        return;
      }

      // Resolve shortcut or use raw cypher
      const shortcut = SHORTCUTS[input.toLowerCase()];
      const cypher = shortcut ? shortcut.cypher : input;
      if (shortcut) console.log(`\n🔎 ${shortcut.desc}\n`);

      try {
        const data = await apiGet(`/api/neo4j/run-query?cypher=${encodeURIComponent(cypher)}`);
        if (!data.success) {
          console.error(`❌ Query failed: ${data.error || 'unknown'}`);
          process.exit(1);
        }

        if (opts.raw) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }

        const raw = (data.cypherResults || '').trim();
        if (!raw) { console.log('(no results)'); return; }

        const lines = raw.split('\n');
        console.log(lines[0]);
        console.log('─'.repeat(Math.max(lines[0].length, 40)));
        for (let i = 1; i < lines.length; i++) console.log(lines[i]);
        console.log(`\n(${lines.length - 1} row${lines.length - 1 === 1 ? '' : 's'})`);
      } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
    });
}
