/**
 * tapestry normalize skeleton <concept> [--node <role>] [--dry-run]
 *
 * Creates missing skeleton nodes for a concept.
 */
import { apiPost } from '../lib/api.js';

export function normalizeSkeletonCommand(normalize) {
  normalize
    .command('skeleton <concept>')
    .description('Create missing skeleton nodes for a concept')
    .option('--node <role>', 'Fix only a specific node (superset|schema|core-graph|class-graph|property-graph)')
    .option('--dry-run', 'Show what would be created without doing it')
    .action(async (concept, opts) => {
      try {
        const body = { concept };
        if (opts.node) body.node = opts.node;
        if (opts.dryRun) body.dryRun = true;

        const res = await apiPost('/api/normalize/skeleton', body);

        if (!res.success) {
          console.error(`❌ ${res.error}`);
          process.exit(1);
        }

        if (res.dryRun) {
          console.log(`\n🏜️  Dry run for "${concept}":`);
          console.log(`   Would create: ${res.missing.join(', ')}\n`);
          return;
        }

        if (!res.created || res.created.length === 0) {
          console.log(`\n✅ ${res.message}\n`);
          return;
        }

        console.log(`\n🔧 ${res.message}\n`);
        for (const c of res.created) {
          console.log(`  ✅ ${c.role}`);
          console.log(`     UUID: ${c.uuid}`);
          console.log(`     Wired: ${c.relType}`);
        }
        console.log('');
      } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
      }
    });
}
