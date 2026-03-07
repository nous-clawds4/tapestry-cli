/**
 * tapestry concept enumerate <enumerating-concept> --property <name> --of <target>
 *
 * Thin client: calls POST /api/normalize/enumerate
 */

import { apiPost } from '../lib/api.js';

export function enumerateCommand(concept) {
  concept
    .command('enumerate <enumerating-concept>')
    .description('Create ENUMERATES relationship (horizontal integration)')
    .requiredOption('--property <property-name>', 'The property being enumerated')
    .requiredOption('--of <target-concept>', 'The concept whose property is being enumerated')
    .option('--property-type <type>', 'JSON type of the property (string, number, boolean, etc.)', 'string')
    .option('--create-property', 'Create the Property node if it doesn\'t exist')
    .action(async (enumeratingConcept, opts) => {
      try {
        const result = await apiPost('/api/normalize/enumerate', {
          enumeratingConcept,
          property: opts.property,
          targetConcept: opts.of,
          propertyType: opts.propertyType,
          createProperty: opts.createProperty || false,
        });

        if (!result.success) {
          console.error(`\n❌ ${result.error}\n`);
          process.exit(1);
        }

        console.log(`\n✅ ${result.message}`);
        console.log(`  Property: ${result.property.name} (${result.property.uuid})`);
        if (result.schemaWired) console.log(`  IS_A_PROPERTY_OF wired to schema`);
        console.log('');
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
