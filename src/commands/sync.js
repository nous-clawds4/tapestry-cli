/**
 * tapestry sync — DEPRECATED
 *
 * This command previously pulled tapestry events from remote relays and bulk-imported
 * into Neo4j using batchTransfer.sh + setup.sh. Those scripts wipe node properties
 * (names, etc.) and create incomplete edges, undoing careful work.
 *
 * Use instead:
 *   - strfry sync (directly) to pull events from relays
 *   - tapestry event update <uuid> to import individual events into Neo4j
 *   - tapestry event import to bulk-import events via the API
 *   - The UI's Neo4j import buttons for individual events
 */

export function syncCommand(program) {
  program
    .command('sync')
    .description('DEPRECATED — see `tapestry event import` instead')
    .action(async () => {
      console.error('⚠️  `tapestry sync` is deprecated.\n');
      console.error('The sync command used batchTransfer.sh + setup.sh which wipe node');
      console.error('properties and create incomplete edges. Use these instead:\n');
      console.error('  strfry sync <relay> --filter \'{"kinds":[9998,9999,39998,39999]}\' --dir down');
      console.error('    → Pull events from a remote relay into local strfry\n');
      console.error('  tapestry event update <uuid>');
      console.error('    → Import/update a single event in Neo4j\n');
      console.error('  tapestry event import');
      console.error('    → Bulk import events from strfry into Neo4j via the API\n');
      process.exit(1);
    });
}
