/**
 * tapestry config — manage CLI configuration (UUIDs, relays, etc.)
 *
 * Subcommands:
 *   list              — show all config keys, values, and sources
 *   get <key>         — get a single value
 *   set <key> <value> — set a user override (persists to .tapestry.json)
 *   reset <key>       — remove user override, revert to default
 *   path              — show the config file location
 *
 * Examples:
 *   tapestry config list
 *   tapestry config list --uuids           # only uuid.* keys
 *   tapestry config list --relays          # only relays.* keys
 *   tapestry config get uuid.superset
 *   tapestry config set uuid.superset 39998:newpubkey:newdtag
 *   tapestry config set relays.publish '["wss://my-relay.com"]'
 *   tapestry config reset uuid.superset
 */

import { getAllConfig, getConfig, setConfig, resetConfig, getConfigPath, getDefaults } from '../lib/config.js';

export function configCommand(program) {
  const cmd = program.command('config').description('Manage CLI configuration (UUIDs, relays, etc.)');

  // ── list ──
  cmd
    .command('list')
    .description('Show all config keys with current values and sources')
    .option('--uuids', 'Only show uuid.* keys')
    .option('--relays', 'Only show relays.* keys')
    .option('--overrides', 'Only show keys with user overrides')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      let entries = getAllConfig();

      if (opts.uuids) entries = entries.filter(e => e.key.startsWith('uuid.'));
      if (opts.relays) entries = entries.filter(e => e.key.startsWith('relays.'));
      if (opts.overrides) entries = entries.filter(e => e.source === 'override');

      if (opts.json) {
        const obj = {};
        for (const e of entries) obj[e.key] = e.value;
        console.log(JSON.stringify(obj, null, 2));
        return;
      }

      if (entries.length === 0) {
        console.log('\n  No config entries found.\n');
        return;
      }

      console.log('');
      // Group by prefix
      let lastPrefix = '';
      for (const entry of entries) {
        const prefix = entry.key.split('.')[0];
        if (prefix !== lastPrefix) {
          if (lastPrefix) console.log('');
          console.log(`  ── ${prefix} ──`);
          lastPrefix = prefix;
        }

        const value = formatValue(entry.value);
        const source = entry.source === 'override' ? ' ⚡ (override)' : '';
        console.log(`  ${entry.key}`);
        console.log(`    ${value}${source}`);
        if (entry.source === 'override' && entry.default !== undefined) {
          console.log(`    default: ${formatValue(entry.default)}`);
        }
      }
      console.log('');
      console.log(`  Config file: ${getConfigPath()}`);
      console.log('');
    });

  // ── get ──
  cmd
    .command('get <key>')
    .description('Get a config value by key')
    .option('--json', 'Output as JSON')
    .action((key, opts) => {
      const value = getConfig(key);
      if (value === undefined) {
        console.error(`  ❌ Unknown config key: "${key}"`);
        console.error(`     Run 'tapestry config list' to see available keys.`);
        process.exit(1);
      }
      if (opts.json) {
        console.log(JSON.stringify(value));
      } else {
        console.log(formatValue(value));
      }
    });

  // ── set ──
  cmd
    .command('set <key> <value>')
    .description('Set a user override for a config key (persists to .tapestry.json)')
    .action((key, value) => {
      // Try to parse as JSON (for arrays, objects, numbers, booleans)
      let parsed;
      try {
        parsed = JSON.parse(value);
      } catch {
        parsed = value; // treat as plain string
      }

      const defaults = getDefaults();
      const isKnown = key in defaults;

      setConfig(key, parsed);

      console.log('');
      console.log(`  ✅ ${key} = ${formatValue(parsed)}`);
      if (!isKnown) {
        console.log(`  ℹ️  "${key}" is not a known default key (custom config).`);
      }
      console.log(`  Saved to: ${getConfigPath()}`);
      console.log('');
    });

  // ── reset ──
  cmd
    .command('reset <key>')
    .description('Remove a user override, reverting to the hardcoded default')
    .action((key) => {
      const removed = resetConfig(key);
      const defaultValue = getConfig(key);

      console.log('');
      if (removed) {
        console.log(`  ✅ Removed override for "${key}"`);
        if (defaultValue !== undefined) {
          console.log(`  Reverted to default: ${formatValue(defaultValue)}`);
        } else {
          console.log(`  ⚠️  No default exists for this key — it is now unset.`);
        }
      } else {
        console.log(`  ℹ️  No override exists for "${key}" — already using default.`);
        if (defaultValue !== undefined) {
          console.log(`  Current value: ${formatValue(defaultValue)}`);
        }
      }
      console.log('');
    });

  // ── path ──
  cmd
    .command('path')
    .description('Show the config file location')
    .action(() => {
      console.log(getConfigPath());
    });
}

/**
 * Format a value for display (handles arrays, objects, strings).
 */
function formatValue(value) {
  if (Array.isArray(value)) {
    return value.map(v => `${v}`).join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}
