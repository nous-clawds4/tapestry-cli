/**
 * tapestry status — show service health and stats
 */

import { apiGet, getBaseUrl } from '../lib/api.js';

export function statusCommand(program) {
  program
    .command('status')
    .description('Show status of all Tapestry services (neo4j, strfry, etc.)')
    .action(async () => {
      await runStatus();
    });
}

async function runStatus() {
  console.log(`🧵 Tapestry Status — ${getBaseUrl()}\n`);

  const [neo4j, strfry, network, ranking, list] = await Promise.allSettled([
    apiGet('/api/neo4j-status'),
    apiGet('/api/strfry-status'),
    apiGet('/api/network-status'),
    apiGet('/api/ranking-status'),
    apiGet('/api/list-status'),
  ]);

  // --- Neo4j ---
  console.log('📊 Neo4j');
  if (neo4j.status === 'fulfilled' && neo4j.value.success) {
    const s = neo4j.value.status;
    console.log(`   Running:        ${s.running ? '✅' : '⚠️  stopped'}`);
    console.log(`   Users:          ${s.userCount}`);
    const rels = s.relationships || {};
    console.log(`   Follows:        ${rels.follow ?? 0}`);
    console.log(`   Mutes:          ${rels.mute ?? 0}`);
    console.log(`   Reports:        ${rels.report ?? 0}`);
    console.log(`   Constraints:    ${(s.constraints || []).length}`);
    console.log(`   Indexes:        ${(s.indexes || []).length}`);
  } else {
    console.log(`   ❌ Error: ${neo4j.reason?.message || neo4j.value?.error || 'unknown'}`);
  }

  // --- strfry ---
  console.log('\n📡 strfry Relay');
  if (strfry.status === 'fulfilled' && strfry.value.success) {
    const s = strfry.value;
    console.log(`   Service:        ${s.service?.status ?? 'unknown'}`);
    console.log(`   Total events:   ${s.events?.total ?? 0}`);
    console.log(`   Recent events:  ${s.events?.recent ?? 0}`);
    if (s.events?.byKind) {
      const kinds = Object.entries(s.events.byKind).filter(([, v]) => v > 0);
      if (kinds.length > 0) {
        console.log(`   By kind:        ${kinds.map(([k, v]) => `${k}(${v})`).join(', ')}`);
      }
    }
  } else {
    console.log(`   ❌ Error: ${strfry.reason?.message || 'unknown'}`);
  }

  // --- Network ---
  console.log('\n🌐 Network');
  if (network.status === 'fulfilled' && network.value) {
    const n = network.value;
    if (n.followers !== undefined) console.log(`   Followers:      ${n.followers}`);
    if (n.following !== undefined) console.log(`   Following:      ${n.following}`);
    if (n.success === false) console.log(`   ⚠️  ${n.error || 'unavailable'}`);
  } else {
    console.log(`   ❌ Error: ${network.reason?.message || 'unknown'}`);
  }

  // --- Ranking ---
  console.log('\n🍇 Ranking');
  if (ranking.status === 'fulfilled' && ranking.value) {
    const r = ranking.value;
    if (r.grapeRank) {
      console.log(`   GrapeRank:      ${r.grapeRank.calculated ? '✅ calculated' : '⏳ not yet'}`);
    }
    if (r.pageRank) {
      console.log(`   PageRank:       ${r.pageRank.calculated ? '✅' : '⏳ not yet'}`);
    }
  } else {
    console.log(`   ❌ Error: ${ranking.reason?.message || 'unknown'}`);
  }

  // --- Lists ---
  console.log('\n📋 Lists');
  if (list.status === 'fulfilled' && list.value) {
    const l = list.value;
    if (l.whitelist) console.log(`   Whitelist:      ${l.whitelist.count ?? 'n/a'} entries`);
    if (l.blacklist) console.log(`   Blacklist:      ${l.blacklist.count ?? 'n/a'} entries`);
  } else {
    console.log(`   ❌ Error: ${list.reason?.message || 'unknown'}`);
  }

  console.log('');
}
