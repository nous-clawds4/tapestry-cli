#!/usr/bin/env node

/**
 * BIOS Bootstrap: Run All Scripts
 * 
 * Runs all Pass 1 BIOS scripts in order to create the canonical concept
 * skeletons from scratch.
 * 
 * Usage:
 *   node src/bios/run-all.js              # Run all scripts
 *   node src/bios/run-all.js --from 05    # Resume from script 05
 *   node src/bios/run-all.js --dry-run    # Show what would be created
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Find all numbered scripts
const scripts = readdirSync(__dirname)
  .filter(f => /^\d{2}-.*\.js$/.test(f))
  .sort();

// Parse args
const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
const startFrom = fromIdx >= 0 ? parseInt(args[fromIdx + 1]) : 0;

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║           TAPESTRY BIOS BOOTSTRAP — Pass 1             ║');
console.log('║         Creating canonical concept skeletons            ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log(`  Scripts to run: ${scripts.length}`);
if (startFrom > 0) console.log(`  Starting from:  ${String(startFrom).padStart(2, '0')}`);
console.log('');

for (const script of scripts) {
  const num = parseInt(script.slice(0, 2));
  if (num < startFrom) {
    console.log(`  ⏭️  Skipping ${script}`);
    continue;
  }

  console.log(`\n${'▓'.repeat(60)}`);
  console.log(`  Running: ${script}`);
  console.log(`${'▓'.repeat(60)}`);

  try {
    // Dynamic import of each script (they run on import)
    await import(pathToFileURL(resolve(__dirname, script)).href);
  } catch (err) {
    console.error(`\n❌ Script ${script} failed: ${err.message}`);
    console.error(`   Fix the issue and resume with: node src/bios/run-all.js --from ${num}`);
    process.exit(1);
  }
}

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║              BIOS Pass 1 Complete! ✨                   ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log('  Next steps:');
console.log('    1. Run `tapestry normalize fix-supersets` to wire IS_THE_CONCEPT_FOR');
console.log('    2. Run `tapestry normalize check` to verify');
console.log('    3. Proceed to Pass 2 scripts (wiring) when ready');
console.log('');
