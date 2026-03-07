/**
 * tapestry event set-json <uuid> <json> — set the json tag on a replaceable event
 *
 * Thin client: calls POST /api/normalize/set-json-tag
 */

import { readFileSync } from 'fs';
import { apiPost } from '../lib/api.js';

/**
 * Set (or remove) the json tag. Callable from CLI and programmatically.
 */
export async function setJsonTag(uuid, opts = {}) {
  const { jsonString, remove, quiet } = opts;
  const log = quiet ? () => {} : console.log;

  const body = { uuid };
  if (remove) {
    body.remove = true;
  } else {
    // Validate JSON
    try {
      JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`Invalid JSON: ${e.message}`);
    }
    body.json = jsonString;
  }

  const result = await apiPost('/api/normalize/set-json-tag', body);
  if (!result.success) throw new Error(result.error);

  log(`\n✅ ${result.message}\n`);
  return result;
}

/**
 * Register the `tapestry event set-json` subcommand.
 */
export function setJsonCommand(eventCmd) {
  eventCmd
    .command('set-json <uuid> [json]')
    .description('Set (or remove) the json tag on a replaceable event')
    .option('--file <path>', 'Read JSON from a file instead of the argument')
    .option('--remove', 'Remove the json tag')
    .action(async (uuid, jsonArg, opts) => {
      try {
        let jsonString;

        if (opts.remove) {
          // Remove mode
        } else if (opts.file) {
          jsonString = readFileSync(opts.file, 'utf8').trim();
        } else if (jsonArg && jsonArg.startsWith('@')) {
          jsonString = readFileSync(jsonArg.slice(1), 'utf8').trim();
        } else if (jsonArg) {
          jsonString = jsonArg;
        } else {
          console.error('  ❌ Provide JSON as an argument, --file <path>, or @path');
          process.exit(1);
        }

        await setJsonTag(uuid, { jsonString, remove: opts.remove });
      } catch (err) {
        console.error(`\n❌ ${err.message}\n`);
        process.exit(1);
      }
    });
}
