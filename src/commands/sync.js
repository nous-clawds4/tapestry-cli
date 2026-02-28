/**
 * tapestry sync — pull tapestry events from remote relays and import into Neo4j
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(execCb);

// Tapestry protocol event kinds
const TAPESTRY_FILTER = '{"kinds":[9998,9999,39998,39999]}';

// Default relays: DLIST_RELAYS + TAPESTRY_FRIENDS_RELAYS from defaults.conf
const DEFAULT_RELAYS = [
  'wss://dcosl.brainstorm.world',
  'wss://dcosl.brainstorm.social/relay',
];

const CONTAINER = 'tapestry-tapestry-1';

export function syncCommand(program) {
  program
    .command('sync')
    .description('Sync tapestry events from remote relays and import into Neo4j')
    .option('--relay-only', 'Only pull from relays, skip Neo4j import')
    .option('--import-only', 'Only import strfry → Neo4j, skip relay sync')
    .option('--relay <url>', 'Sync from a specific relay (can be repeated)', collect, [])
    .action(async (opts) => {
      await runSync(opts);
    });
}

function collect(val, arr) {
  arr.push(val);
  return arr;
}

async function runSync(opts) {
  const startTime = Date.now();

  if (!opts.importOnly) {
    // Step 1: Relay sync via strfry sync inside Docker container
    const relays = opts.relay.length > 0 ? opts.relay : DEFAULT_RELAYS;
    console.log(`🔄 Syncing tapestry events from ${relays.length} relay(s)...\n`);

    for (const relay of relays) {
      console.log(`  📡 ${relay}`);
      try {
        const cmd = `docker exec ${CONTAINER} strfry sync ${relay} --filter '${TAPESTRY_FILTER}' --dir down 2>&1`;
        const { stdout } = await execAsync(cmd, { timeout: 120000 });
        const output = stdout || '';

        // Parse strfry sync output
        const lines = output.split('\n');
        // Look for "Have X need Y" reconciliation summary
        const reconLine = lines.find(l => /Have \d+ need \d+/.test(l));
        if (reconLine) {
          const match = reconLine.match(/Have (\d+) need (\d+)/);
          const have = match[1], need = match[2];
          console.log(`     ✅ ${need} new events pulled (${have} already synced)`);
        } else {
          const summaryLine = lines.find(l => /insert|save|skip/i.test(l));
          console.log(`     ✅ ${summaryLine ? summaryLine.trim() : 'done'}`);
        }
      } catch (err) {
        // strfry exits non-zero even on success sometimes; check output
        const output = err.stdout || err.stderr || '';
        const reconLine = output.split('\n').find(l => /Have \d+ need \d+/.test(l));
        if (reconLine) {
          const match = reconLine.match(/Have (\d+) need (\d+)/);
          console.log(`     ✅ ${match[2]} new events pulled (${match[1]} already synced)`);
        } else {
          const msg = output || err.message;
          console.log(`     ❌ ${msg.trim().split('\n').pop()}`);
        }
      }
    }
    console.log('');
  }

  if (!opts.relayOnly) {
    // Step 2: Import strfry → Neo4j via batchTransfer.sh
    console.log('📊 Importing events into Neo4j concept graph...');
    try {
      const { stdout } = await execAsync(
        `docker exec ${CONTAINER} bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/batchTransfer.sh`,
        { timeout: 120000 }
      );

      const output = stdout || '';
      const eventMatch = output.match(/Found (\d+) events/);
      const tagMatch = output.match(/Created (\d+) tag objects/);
      const events = eventMatch ? eventMatch[1] : '?';
      const tags = tagMatch ? tagMatch[1] : '?';
      console.log(`   ✅ ${events} events → ${tags} tags imported\n`);
    } catch (err) {
      console.error(`   ❌ Import failed: ${err.message}\n`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Done in ${elapsed}s`);
}
