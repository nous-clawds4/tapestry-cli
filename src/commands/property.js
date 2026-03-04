/**
 * tapestry property <subcommand>
 *
 * Commands for managing concept properties.
 */
import { propertyCreateCommand } from './property-create.js';
import { propertyGenerateTreeCommand } from './property-generate-tree.js';
import { propertyGenerateJsonSchemaCommand } from './property-generate-json-schema.js';

export function propertyCommand(program) {
  const property = program
    .command('property')
    .description('Manage concept properties');

  propertyCreateCommand(property);
  propertyGenerateTreeCommand(property);
  propertyGenerateJsonSchemaCommand(property);
}
