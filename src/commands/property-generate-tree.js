/**
 * tapestry property generate-tree <concept>
 *
 * Reads the concept's JSON Schema and creates property events for all
 * properties (recursively for nested objects), wires IS_A_PROPERTY_OF,
 * and updates the property tree graph JSON.
 */
import { apiPost } from '../lib/api.js';

export function propertyGenerateTreeCommand(property) {
  property
    .command('generate-tree <concept>')
    .description('Generate a full property tree from a concept\'s JSON Schema')
    .action(async (concept) => {
      try {
        console.log(`🌿 Generating property tree for "${concept}"...`);

        const data = await apiPost('/api/normalize/generate-property-tree', { concept });

        if (!data.success) {
          console.error(`❌ ${data.error}`);
          process.exit(1);
        }

        console.log(`✅ ${data.message}`);
        console.log(`   Graph updated: ${data.graphUpdated ? 'yes' : 'no'}`);
        console.log();
        console.log('Properties created:');
        for (const p of data.properties) {
          const indent = p.parentUuid && !p.parentUuid.includes('schema') ? '  └─' : '  •';
          console.log(`${indent} ${p.name} (${p.type}) → ${p.uuid}`);
        }
      } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
    });
}
