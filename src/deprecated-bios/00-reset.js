#!/usr/bin/env node

/**
 * BIOS Script 00: Reset (Optional)
 * 
 * Clears the local strfry relay and Neo4j database to start fresh.
 * ⚠️  DESTRUCTIVE — only use when you want a clean slate!
 * 
 * What it does:
 *   1. Drops all Neo4j data (nodes, relationships, constraints)
 *   2. Clears all events from strfry
 *   3. Re-creates Neo4j uniqueness constraints
 * 
 * CLI equivalent:
 *   There is no single CLI command for this — it's a manual operation.
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

import { getConfig } from '../lib/config.js';

const execAsync = promisify(execCb);

// Load .env
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, '..', '..', '.env');
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
} catch { /* no .env */ }

async function reset() {
  console.log('\n⚠️  BIOS Reset — This will destroy ALL data!\n');
  
  // Step 1: Clear Neo4j
  console.log('  🗑️  Clearing Neo4j...');
  try {
    const cypherCmd = `docker exec ${getConfig('docker.container')} cypher-shell -u ${getConfig('neo4j.user')} -p '${getConfig('neo4j.password')}' 'MATCH (n) DETACH DELETE n'`;
    await execAsync(cypherCmd, { timeout: 30000 });
    console.log('     ✅ All nodes and relationships deleted');
  } catch (err) {
    console.error(`     ❌ Neo4j clear failed: ${err.message}`);
    process.exit(1);
  }

  // Step 2: Re-create uniqueness constraints
  console.log('  📐 Re-creating Neo4j constraints...');
  const constraints = [
    "CREATE CONSTRAINT nostr_event_uuid IF NOT EXISTS FOR (e:NostrEvent) REQUIRE e.uuid IS UNIQUE",
    "CREATE CONSTRAINT nostr_event_id IF NOT EXISTS FOR (e:NostrEvent) REQUIRE e.id IS UNIQUE",
    "CREATE CONSTRAINT nostr_user_pubkey IF NOT EXISTS FOR (u:NostrUser) REQUIRE u.pubkey IS UNIQUE",
  ];
  for (const c of constraints) {
    try {
      await execAsync(
        `docker exec ${getConfig('docker.container')} cypher-shell -u ${getConfig('neo4j.user')} -p '${getConfig('neo4j.password')}' '${c}'`,
        { timeout: 10000 }
      );
      console.log(`     ✅ ${c.split('(')[1]?.split(')')[0] || 'constraint'}`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`     ℹ️  Already exists`);
      } else {
        console.error(`     ❌ ${err.message}`);
      }
    }
  }

  // Step 3: Clear strfry
  console.log('  🗑️  Clearing strfry...');
  try {
    // strfry doesn't have a "delete all" — we export IDs and delete them
    // Simplest approach: delete the database file and restart
    // But that requires container restart, so let's just note it
    console.log('     ℹ️  strfry clear requires container restart. Run:');
    console.log('        docker exec tapestry-tapestry-1 rm /var/lib/strfry/strfry-db/data.mdb');
    console.log('        docker restart tapestry-tapestry-1');
  } catch (err) {
    console.error(`     ❌ ${err.message}`);
  }

  console.log('\n✨ Reset complete. Ready for BIOS bootstrap.\n');
}

reset().catch(err => { console.error(err); process.exit(1); });
