/**
 * Publish Tapestry Protocol events (kind 39998 headers, kind 39999 items) to Nostr relays.
 */

import { finalizeEvent, type EventTemplate } from 'nostr-tools';

export const KIND_HEADER = 39998;
export const KIND_ITEM = 39999;

export interface HeaderOptions {
  name: string;
  description?: string;
  dTag: string;
  supersetDTag?: string;
  additionalTags?: string[][];
}

export interface ItemOptions {
  name: string;
  dTag: string;
  parentDTag: string;
  data?: Record<string, unknown>;
  additionalTags?: string[][];
}

/**
 * Build a kind 39998 list header event template.
 */
export function buildHeaderEvent(opts: HeaderOptions): EventTemplate {
  const tags: string[][] = [
    ['d', opts.dTag],
    ['names', opts.name],
  ];

  if (opts.description) {
    tags.push(['description', opts.description]);
  }

  if (opts.supersetDTag) {
    tags.push(['z', opts.supersetDTag]);
  }

  if (opts.additionalTags) {
    tags.push(...opts.additionalTags);
  }

  return {
    kind: KIND_HEADER,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: '',
  };
}

/**
 * Build a kind 39999 list item event template.
 */
export function buildItemEvent(opts: ItemOptions): EventTemplate {
  const tags: string[][] = [
    ['d', opts.dTag],
    ['name', opts.name],
    ['z', opts.parentDTag],
  ];

  if (opts.additionalTags) {
    tags.push(...opts.additionalTags);
  }

  return {
    kind: KIND_ITEM,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: opts.data ? JSON.stringify(opts.data) : '',
  };
}

/**
 * Sign and publish an event to relays.
 */
export async function publishHeader(opts: HeaderOptions, sk: Uint8Array, relayUrls: string[]): Promise<string> {
  const template = buildHeaderEvent(opts);
  const event = finalizeEvent(template, sk);

  // Dynamic import to avoid top-level side effects
  const { Relay } = await import('nostr-tools/relay');

  for (const url of relayUrls) {
    try {
      const relay = await Relay.connect(url);
      await relay.publish(event);
      relay.close();
    } catch (e) {
      console.error(`Failed to publish to ${url}:`, e);
    }
  }

  return event.id;
}

/**
 * Sign and publish an item event to relays.
 */
export async function publishItem(opts: ItemOptions, sk: Uint8Array, relayUrls: string[]): Promise<string> {
  const template = buildItemEvent(opts);
  const event = finalizeEvent(template, sk);

  const { Relay } = await import('nostr-tools/relay');

  for (const url of relayUrls) {
    try {
      const relay = await Relay.connect(url);
      await relay.publish(event);
      relay.close();
    } catch (e) {
      console.error(`Failed to publish to ${url}:`, e);
    }
  }

  return event.id;
}
