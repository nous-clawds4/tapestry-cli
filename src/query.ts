/**
 * Query Nostr relays and the Brainstorm concept graph API.
 */

import type { Filter } from 'nostr-tools';

export const BRAINSTORM_API = 'https://dcosl.brainstorm.social/api/neo4j/run-query';
export const DCOSL_RELAY = 'wss://dcosl.brainstorm.social/relay';

/**
 * Query a relay for events matching a filter. Returns events array.
 */
export async function queryRelay(relayUrl: string, filter: Filter, timeoutMs = 5000): Promise<any[]> {
  const { Relay } = await import('nostr-tools/relay');
  const events: any[] = [];

  const relay = await Relay.connect(relayUrl);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      relay.close();
      resolve(events);
    }, timeoutMs);

    const sub = relay.subscribe([filter], {
      onevent(event: any) {
        events.push(event);
      },
      oneose() {
        clearTimeout(timeout);
        relay.close();
        resolve(events);
      },
    });
  });
}

/**
 * Query the Brainstorm neo4j API with a Cypher query.
 */
export async function queryConcept(cypher: string): Promise<any> {
  const url = `${BRAINSTORM_API}?cypher=${encodeURIComponent(cypher)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Brainstorm API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
