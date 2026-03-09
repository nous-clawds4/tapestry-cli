# Relationship

A directed edge between two nodes. A relationship has three components:

1. **nodeFrom** — the source node (referenced by slug or uuid)
2. **nodeTo** — the target node (referenced by slug or uuid)
3. **relationshipType** — the [type](./relationship-type.md) of the relationship (e.g., `IS_THE_CONCEPT_FOR`)

Relationships are the glue that holds the concept graph together. The [class thread](./class-thread.md) structure, [core node](./core-nodes.md) wiring, and [property tree](./property-tree-graph.md) are all expressed as relationships.

## Wrapped and Unwrapped Relationships

A relationship may be [**wrapped**](./wrapped-data.md) (backed by a dedicated nostr event) or [**unwrapped**](./wrapped-data.md) (existing only as a Neo4j edge or as data embedded within another event).

**Wrapped relationships** are kind 39999 events with tags for nodeFrom, nodeTo, and relationshipType. They are independently addressable, signed, and relayable.

**Unwrapped relationships** exist as Neo4j edges for graph traversal but have no standalone nostr event. Many relationships are unwrapped by necessity — see [wrapped data](./wrapped-data.md) for why the protocol requires this.

In practice, most relationships are unwrapped. Wrapping is a deliberate choice to make a specific edge portable and verifiable on the network.

## See Also
- [Wrapped Data](./wrapped-data.md)
- [Relationship Type](./relationship-type.md)
- [Class Thread](./class-thread.md)
- [Relationship spec](../node-types/relationship-type.md)
