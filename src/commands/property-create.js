/**
 * tapestry property create <name> --concept <name> [--parent <uuid>] [--type string] [--description "..."] [--required]
 *
 * Creates a single property event and wires it to the concept's JSON Schema
 * (for top-level) or to a parent property (for nested schemas).
 */
import { apiPost } from '../lib/api.js';

export function propertyCreateCommand(property) {
  property
    .command('create <name>')
    .description('Create a property for a concept')
    .option('--concept <name>', 'Parent concept name (for top-level properties)')
    .option('--parent <uuid>', 'Parent property UUID (for nested properties)')
    .option('--type <type>', 'JSON type (string, number, integer, boolean, object, array)', 'string')
    .option('--description <desc>', 'Property description', '')
    .option('--required', 'Mark as required')
    .action(async (name, opts) => {
      if (!opts.concept && !opts.parent) {
        console.error('❌ Either --concept or --parent is required');
        process.exit(1);
      }

      try {
        const body = { name, type: opts.type, description: opts.description, required: !!opts.required };
        if (opts.concept) body.concept = opts.concept;
        if (opts.parent) body.parentUuid = opts.parent;

        const data = await apiPost('/api/normalize/create-property', body);

        if (!data.success) {
          console.error(`❌ ${data.error}`);
          process.exit(1);
        }

        console.log(`✅ ${data.message}`);
        console.log(`   UUID: ${data.property.uuid}`);
        console.log(`   Type: ${data.property.type}`);
        console.log(`   Target: ${data.property.targetName} (${data.property.targetUuid})`);
      } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
    });
}
