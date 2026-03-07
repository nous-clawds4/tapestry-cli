/**
 * tapestry concept add <concept> <item-name> — add an item to a concept
 *
 * Thin client: calls POST /api/normalize/create-element
 */

import { apiPost } from '../lib/api.js';

export function addItemCommand(concept) {
  concept
    .command('add <concept-name> <item-name>')
    .description('Add an item (kind 39999) to an existing concept')
    .option('--description <text>', 'Description of the item')
    .action(async (conceptName, itemName, opts) => {
      try {
        const result = await apiPost('/api/normalize/create-element', {
          concept: conceptName,
          name: itemName,
        });

        if (!result.success) {
          console.error(`\n❌ ${result.error}\n`);
          process.exit(1);
        }

        const e = result.element;
        console.log(`\n✅ ${result.message}`);
        console.log(`  UUID:     ${e.uuid}`);
        console.log(`  Concept:  ${e.concept}`);
        console.log('');
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
