/**
 * tapestry migrate — one-time migration commands
 */

import { apiPost } from '../lib/api.js';

export function migrateCommand(program) {
  const migrate = program
    .command('migrate')
    .description('Run one-time migration commands');

  migrate
    .command('concept-header-label')
    .description('Rename ClassThreadHeader → ConceptHeader label in Neo4j')
    .action(async () => {
      console.log('\n🔄 Migrating ClassThreadHeader → ConceptHeader...\n');

      try {
        // Count existing ClassThreadHeader nodes
        const countResult = await apiPost('/api/neo4j/query', {
          cypher: "MATCH (n:ClassThreadHeader) RETURN count(n) AS cnt",
        });
        const countLine = (countResult.cypherResults || '').trim().split('\n');
        const count = countLine.length > 1 ? countLine[1].trim() : '0';

        if (count === '0') {
          console.log('  No ClassThreadHeader nodes found. Nothing to migrate.');
          console.log('  (Nodes may already be labeled ConceptHeader, or none exist yet.)\n');
          return;
        }

        console.log(`  Found ${count} ClassThreadHeader node(s). Relabeling...`);

        // Add ConceptHeader label and remove ClassThreadHeader label
        const result = await apiPost('/api/neo4j/query', {
          cypher: "MATCH (n:ClassThreadHeader) SET n:ConceptHeader REMOVE n:ClassThreadHeader RETURN count(n) AS migrated",
        });
        const migLine = (result.cypherResults || '').trim().split('\n');
        const migrated = migLine.length > 1 ? migLine[1].trim() : '0';

        console.log(`  ✅ Migrated ${migrated} node(s): ClassThreadHeader → ConceptHeader\n`);
      } catch (err) {
        console.error(`  ❌ Migration failed: ${err.message}\n`);
        process.exit(1);
      }
    });

  migrate
    .command('concept-graph-rel')
    .description('Rename IS_THE_CLASS_THREADS_GRAPH_FOR → IS_THE_CONCEPT_GRAPH_FOR relationships in Neo4j')
    .action(async () => {
      console.log('\n🔄 Migrating IS_THE_CLASS_THREADS_GRAPH_FOR → IS_THE_CONCEPT_GRAPH_FOR...\n');

      try {
        // Count existing relationships
        const countResult = await apiPost('/api/neo4j/query', {
          cypher: "MATCH ()-[r:IS_THE_CLASS_THREADS_GRAPH_FOR]->() RETURN count(r) AS cnt",
        });
        const countLine = (countResult.cypherResults || '').trim().split('\n');
        const count = countLine.length > 1 ? countLine[1].trim() : '0';

        if (count === '0') {
          console.log('  No IS_THE_CLASS_THREADS_GRAPH_FOR relationships found. Nothing to migrate.\n');
          return;
        }

        console.log(`  Found ${count} relationship(s). Migrating...`);

        // Neo4j can't rename relationship types directly — need to create new and delete old
        const result = await apiPost('/api/neo4j/query', {
          cypher: "MATCH (a)-[r:IS_THE_CLASS_THREADS_GRAPH_FOR]->(b) CREATE (a)-[:IS_THE_CONCEPT_GRAPH_FOR]->(b) DELETE r RETURN count(a) AS migrated",
        });
        const migLine = (result.cypherResults || '').trim().split('\n');
        const migrated = migLine.length > 1 ? migLine[1].trim() : '0';

        console.log(`  ✅ Migrated ${migrated} relationship(s)\n`);
      } catch (err) {
        console.error(`  ❌ Migration failed: ${err.message}\n`);
        process.exit(1);
      }
    });

  migrate
    .command('all')
    .description('Run all pending migrations')
    .action(async () => {
      console.log('\n🔄 Running all migrations...\n');

      // 1. Label rename
      try {
        const countResult = await apiPost('/api/neo4j/query', {
          cypher: "MATCH (n:ClassThreadHeader) SET n:ConceptHeader REMOVE n:ClassThreadHeader RETURN count(n) AS migrated",
        });
        const line = (countResult.cypherResults || '').trim().split('\n');
        const migrated = line.length > 1 ? line[1].trim() : '0';
        console.log(`  ✅ ClassThreadHeader → ConceptHeader: ${migrated} node(s)`);
      } catch (err) {
        console.error(`  ❌ Label migration failed: ${err.message}`);
      }

      // 2. Relationship rename
      try {
        const countResult = await apiPost('/api/neo4j/query', {
          cypher: "MATCH (a)-[r:IS_THE_CLASS_THREADS_GRAPH_FOR]->(b) CREATE (a)-[:IS_THE_CONCEPT_GRAPH_FOR]->(b) DELETE r RETURN count(a) AS migrated",
        });
        const line = (countResult.cypherResults || '').trim().split('\n');
        const migrated = line.length > 1 ? line[1].trim() : '0';
        console.log(`  ✅ IS_THE_CLASS_THREADS_GRAPH_FOR → IS_THE_CONCEPT_GRAPH_FOR: ${migrated} relationship(s)`);
      } catch (err) {
        console.error(`  ❌ Relationship migration failed: ${err.message}`);
      }

      console.log('\n✨ All migrations complete.\n');
    });
}
