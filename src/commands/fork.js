/**
 * tapestry fork <node-name> — fork another author's node
 *
 * Thin client: calls POST /api/normalize/fork-node
 */

import { apiPost } from '../lib/api.js';

function collect(value, previous) {
  return previous.concat([value]);
}

export function forkCommand(program) {
  program
    .command('fork <node-name>')
    .description('Fork another author\'s node — copy, swap relationships, link provenance')
    .option('--edit-tag <key=value...>', 'Edit a tag value (repeatable)', collect, [])
    .option('--add-tag <key=value...>', 'Add a new tag (repeatable)', collect, [])
    .option('--remove-tag <key...>', 'Remove a tag by type (repeatable)', collect, [])
    .action(async (nodeName, opts) => {
      try {
        // Convert CLI tag options to API format
        const editTags = {};
        for (const edit of (opts.editTag || [])) {
          const eq = edit.indexOf('=');
          if (eq < 0) { console.error(`❌ --edit-tag format: key=value`); process.exit(1); }
          editTags[edit.slice(0, eq)] = edit.slice(eq + 1);
        }
        const addTags = {};
        for (const add of (opts.addTag || [])) {
          const eq = add.indexOf('=');
          if (eq < 0) { console.error(`❌ --add-tag format: key=value`); process.exit(1); }
          addTags[add.slice(0, eq)] = add.slice(eq + 1);
        }

        const result = await apiPost('/api/normalize/fork-node', {
          name: nodeName,
          editTags: Object.keys(editTags).length ? editTags : undefined,
          addTags: Object.keys(addTags).length ? addTags : undefined,
          removeTags: opts.removeTag?.length ? opts.removeTag : undefined,
        });

        if (!result.success) {
          console.error(`\n❌ ${result.error}\n`);
          process.exit(1);
        }

        console.log(`\n✅ ${result.message}`);
        console.log(`  Original: ${result.original.name} (${result.original.uuid})`);
        console.log(`  Fork:     ${result.fork.uuid}`);
        console.log(`  Swapped:  ${result.swappedRelationships} relationship(s)\n`);
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
