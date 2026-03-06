# Concept

Has three related meanings depending on context:

1. **The [Concept Header](./concept-header.md) node** — the single node from which all class threads emanate
2. **The [Concept Graph](./concept-graph.md)** — the collection of all nodes and edges traversed by every class thread from that Concept Header, including the Superset, Sets, and Elements
3. **The full concept** — the union of the Concept Graph, the [Core Nodes Graph](./core-nodes-graph.md), and the [Property Tree Graph](./property-tree-graph.md)

Which meaning is intended is usually clear from context. When precision matters, use the specific term.

**What makes something a concept is its position in the graph, not its event kind.** Specifically: a concept exists when a node is the source of a [class thread initiation](./class-thread-initiation.md) relationship (IS_THE_CONCEPT_FOR) *and* there are [elements](./element.md) (explicit or implicit) reachable via class threads from that node.

## See Also
- [Concept Header](./concept-header.md)
- [Proto Concept](./proto-concept.md)
- [Class Thread](./class-thread.md)
- [Core Nodes](./core-nodes.md)
