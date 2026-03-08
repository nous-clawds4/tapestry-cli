# Relationship

An explicit directed edge between two nodes, recorded both as a nostr event (kind 39999) and as a Neo4j edge. A relationship has three components:

1. **nodeFrom** — the source node (referenced by slug or uuid)
2. **nodeTo** — the target node (referenced by slug or uuid)
3. **relationshipType** — the [type](./relationship-type.md) of the relationship (e.g., `IS_THE_CONCEPT_FOR`)

Relationships are the glue that holds the concept graph together. The [class thread](./class-thread.md) structure, [core node](./core-nodes.md) wiring, and [property tree](./property-tree-graph.md) are all expressed as relationships.

## Dual Storage

Relationships exist in two places simultaneously:

- **Nostr:** a kind 39999 event with tags for nodeFrom, nodeTo, and relationshipType
- **Neo4j:** a direct edge between nodes, enabling efficient graph traversal and Cypher queries

The nostr event is the source of truth; the Neo4j edge is a derived index for performance.

## See Also
- [Relationship Type](./relationship-type.md)
- [Class Thread](./class-thread.md)
- [Relationship spec](../node-types/relationship-type.md)
