/**
 * tapestry normalize json <concept> [--node <role>]
 *
 * Regenerates JSON tags for skeleton nodes of a concept.
 */
import { apiPost } from '../lib/api.js';

export function normalizeJsonCommand(normalize) {
  normalize
    .command('json <concept>')
    .description('Regenerate JSON tags for skeleton nodes of a concept')
    .option('--node <role>', 'Fix only a specific node (header|superset|schema|core-graph|class-graph|property-graph)')
    .action(async (concept, opts) => {
      try {
        const body = { concept };
        if (opts.node) body.node = opts.node;

        const res = await apiPost('/api/normalize/json', body);

        if (!res.success) {
          console.error(`❌ ${res.error}`);
          process.exit(1);
        }

        if (!res.updated || res.updated.length === 0) {
          console.log(`\n✅ ${res.message}\n`);
          return;
        }

        console.log(`\n📝 ${res.message}\n`);
        for (const u of res.updated) {
          console.log(`  ✅ ${u.role}`);
          console.log(`     UUID: ${u.uuid}`);
        }
        console.log('');
      } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
      }
    });
}
