/**
 * tapestry property generate-json-schema <concept>
 *
 * Reads the concept's property tree and generates a JSON Schema from it.
 * Saves the schema to the concept's JSONSchema node.
 */
import { apiPost } from '../lib/api.js';

export function propertyGenerateJsonSchemaCommand(property) {
  property
    .command('generate-json-schema <concept>')
    .description('Generate a JSON Schema from a concept\'s property tree')
    .action(async (concept) => {
      try {
        console.log(`📋 Generating JSON Schema for "${concept}" from property tree...`);

        const data = await apiPost('/api/property/generate-json-schema', { concept });

        if (!data.success) {
          console.error(`❌ ${data.error}`);
          process.exit(1);
        }

        console.log(`✅ ${data.message}`);
        console.log(`   Saved: ${data.saved ? 'yes' : 'no'}`);

        if (data.warnings && data.warnings.length > 0) {
          console.log();
          console.log('⚠️  Warnings:');
          for (const w of data.warnings) {
            console.log(`   • ${w}`);
          }
        }

        console.log();
        console.log('Generated schema:');
        console.log(JSON.stringify(data.schema, null, 2));
      } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
    });
}
