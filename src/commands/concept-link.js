/**
 * tapestry concept link <parent> --superset-of <child>
 *
 * Thin client: calls POST /api/normalize/link-concepts
 */

import { apiPost } from '../lib/api.js';

export function linkCommand(concept) {
  concept
    .command('link <parent-concept>')
    .description('Link two concepts: parent IS_A_SUPERSET_OF child')
    .requiredOption('--superset-of <child-concept>', 'The child concept (parent is a superset of this)')
    .action(async (parentName, opts) => {
      try {
        const result = await apiPost('/api/normalize/link-concepts', {
          parent: parentName,
          child: opts.supersetOf,
        });

        if (!result.success) {
          console.error(`\n❌ ${result.error}\n`);
          process.exit(1);
        }

        console.log(`\n✅ ${result.message}`);
        console.log(`  Parent superset: ${result.parent.supersetUuid}`);
        console.log(`  Child superset:  ${result.child.supersetUuid}\n`);
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
