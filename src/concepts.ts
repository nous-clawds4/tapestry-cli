/**
 * Class Thread logic for the Tapestry Protocol.
 *
 * A Class Thread is the fundamental path through a concept:
 *   Initiation (ListHeader → Superset) + Propagation (Superset → Superset, 0+ hops) + Termination (Superset → Element)
 *
 * This module helps build and validate class thread structures.
 */

export interface ClassThread {
  /** The root list header d-tag */
  root: string;
  /** Ordered superset d-tags from root to leaf */
  supersets: string[];
  /** Element d-tags at the leaf level */
  elements: string[];
}

/**
 * Build a simple single-level class thread (header → elements, no intermediate supersets).
 * This is the simplest concept structure: a flat list.
 */
export function buildClassThread(rootDTag: string, elementDTags: string[]): ClassThread {
  return {
    root: rootDTag,
    supersets: [],
    elements: elementDTags,
  };
}

/**
 * Build a hierarchical class thread with superset layers.
 */
export function buildHierarchicalThread(
  rootDTag: string,
  supersetDTags: string[],
  elementDTags: string[]
): ClassThread {
  return {
    root: rootDTag,
    supersets: supersetDTags,
    elements: elementDTags,
  };
}
