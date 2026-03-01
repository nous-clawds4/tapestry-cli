#!/usr/bin/env node

/**
 * tapestry - CLI for curating concepts via the Tapestry Protocol on Nostr
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { statusCommand } from '../src/commands/status.js';
import { queryCommand } from '../src/commands/query.js';
import { syncCommand } from '../src/commands/sync.js';
import { conceptCommand } from '../src/commands/concept.js';
import { normalizeCommand } from '../src/commands/normalize.js';
import { setCommand } from '../src/commands/set.js';
import { forkCommand } from '../src/commands/fork.js';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* no .env, that's fine */ }

const program = new Command();

program
  .name('tapestry')
  .description('CLI tools for curating concepts via the Tapestry Protocol on Nostr')
  .version('0.1.0');

statusCommand(program);
queryCommand(program);
syncCommand(program);
conceptCommand(program);
normalizeCommand(program);
setCommand(program);
forkCommand(program);

program.parse();
