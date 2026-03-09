# Wrapped Data

A node or relationship is **wrapped** when it has a corresponding nostr event — a kind 9998, 9999, 39998 or 39999 event that packages the entity with a pubkey, signature, event id, and tags. A **wrapped** entity is independently addressable on the nostr network: it can be subscribed to, verified, and relayed.

An **unwrapped** node or relationship has no corresponding nostr event. It exists only as local data (e.g., a Neo4j node or edge) or as content embedded within another event (e.g., nodes listed inside a [graph](./concept-graph.md) event's JSON).

## Why Unwrapped Entities Must Exist

The tapestry protocol **requires** unwrapped relationships. Without them, event creation triggers infinite recursion:

1. Create a relationship → wrap it as a nostr event
2. Import the event into Neo4j → creates tag nodes and `HAS_TAG` edges
3. Each new edge is a relationship → needs its own event
4. Each new event creates more tags → more edges → more events → ∞

By allowing relationships (and potentially nodes) to be unwrapped, the protocol breaks this cycle. The Neo4j edge exists and is fully functional for graph traversal — it simply has no standalone nostr event backing it.

## Other Reasons for Unwrapped Data

Infinite recursion avoidance is the architectural necessity, but there are many practical reasons to leave data unwrapped:

- **Privacy** — not every piece of local data belongs on a nostr relay
- **Ephemeral data** — temporary or intermediate computations
- **Derived data** — edges inferred from structure (e.g., `HAS_TAG` edges derived from event tags)
- **Efficiency** — wrapping every edge would bloat the event count with minimal benefit

In practice, unwrapped may be the **default**. Wrapping an entity in a nostr event is a deliberate choice — a decision to make that data portable, verifiable, and addressable on the network.

## Wrapped vs Unwrapped Summary

| | Wrapped | Unwrapped |
|---|---|---|
| Nostr event | ✅ dedicated event | ❌ no event |
| Signed | ✅ pubkey + signature | ❌ unsigned |
| Portable | ✅ relayable, subscribable | ❌ local only (unless embedded in a graph) |
| Neo4j | ✅ node or edge | ✅ node or edge |
| Example | a Superset node (kind 39999) | a `HAS_TAG` edge |

## Communicating Unwrapped Data

Unwrapped nodes and relationships are not invisible to the network. A single wrapped [graph](./concept-graph.md) event can describe many unwrapped nodes and edges within its JSON. One event, many entities. This is how the tapestry protocol communicates graph structure efficiently.

## See Also
- [Relationship](./relationship.md)
- [Node Type](./node-type.md)
- [Concept Graph](./concept-graph.md)
