# Duality

In the tapestry protocol, the same data can have two complementary representations:

- **Topological representation:** encoded in graph structure — nodes, edges, and traversals. The canonical example is the [class thread](./class-thread.md): to find all elements of a concept, traverse the path from [Concept Header](./concept-header.md) → [Superset](./superset.md) → [Set](./set.md) → [Element](./element.md). The data is implicit in the shape of the graph.

- **Serialized representation:** stored as a document — typically a JSON Schema or a JSON object within a word's `json` tag. The same element list that a class thread traversal produces can be stored directly in a Set node's JSON, ready for retrieval without any graph traversal.

The topological form is the **source of truth**. The serialized form is a **derived artifact** optimized for retrieval, portability, and performance. The two are kept in sync by explicit rebuild actions, not automatic propagation.

## Not all data has both representations

Duality is not universal — it is applied selectively based on access patterns:

- **Frequently accessed data** is given a serialized representation for performance. Element lists of actively queried concepts, JSON Schemas assembled from property trees, and trust scores compiled from graph traversals are all candidates.

- **Infrequently accessed data** may exist only in topological form. If a relationship or membership is rarely queried, the cost of maintaining a serialized copy is not justified.

- **Imported data** may initially exist only in serialized form. Files received from the trusted community — element lists, schemas, ratings — may not yet have been incorporated into the graph topology, and in some cases never will be. This is the natural state of data that arrives from the network before local processing.

The interplay between these two representations — deciding what to materialize, when to rebuild, and how to reconcile imported files with local topology — is a central design concern for optimizing the overall performance of a tapestry instance.

## Existing examples

The first and clearest instance of duality in the protocol is the relationship between the **property tree** and the **JSON Schema**:

- The property tree is the topological representation: [Property](./property.md) nodes connected by `IS_A_PROPERTY_OF` edges, with `ENUMERATES` relationships linking to other concepts.
- The JSON Schema is the serialized representation: a single document assembled from the property tree, stored in the `json` tag of the JSON Schema node.
- Either can be derived from the other. They are kept in sync by explicit generate/rebuild actions.

> *"The JSON Schema node is ultimately a derived artifact — the canonical, assembled result of the property tree. But the property tree can itself be derived from a JSON Schema."*
> — [JSON Schema node type docs](../node-types/json-schema.md)

The next application of duality is **element lists on Set nodes**: compiling the results of class thread traversals into the Set's JSON for direct retrieval.

## The tapestryKey

Every node in the concept graph is assigned a **`tapestryKey`** — a randomly generated identifier, created once and never changed, stored as a Neo4j node property. The tapestryKey is the permanent handle for a node across its entire lifecycle, regardless of whether the node is wrapped (backed by a nostr event) or unwrapped (exists only locally).

This is distinct from the node's `uuid`, which is derived from the nostr event layer (aTag for kind 39998, event.id for kind 9998). The `uuid` changes when an unwrapped node is published to the network. The `tapestryKey` does not.

The default value is the stringified empty object: `{}`, indicating the key exists but the serialized representation has not yet been computed. When the derived JSON is computed, it is stored in an LMDB key-value database keyed by `tapestryKey`.

Every node gets a tapestryKey (it's cheap — just a UUID). But not every node needs a populated LMDB entry immediately. The tapestryKey is the *claim* that a serialized representation could exist; the LMDB entry is the *fulfillment* of that claim.

## The Duality Conjecture

> *Given a fully normalized tapestry without any errors, the complete set of (tapestryKey, fully-derived JSON) pairs and the complete graph are informationally equivalent — either can be reconstructed from the other without loss.*

In other words: the topology and the documents are two complete encodings of the same information. Given all the serialized JSONs, the graph can be rebuilt in full. Given the complete graph, every JSON can be derived.

This is a genuine conjecture, not a trivially true statement. The "fully derived JSON" must encode enough information to reconstruct not just node properties, but *relationships*:

- The JSON of a Set node contains its element list — encoding HAS_ELEMENT edges.
- The JSON of a Property node encodes its ENUMERATES relationships.
- Implicit relationships derived from z-tags are recoverable from the event data embedded in the JSON.
- Explicit relationship events are themselves nodes with their own tapestryKeys, so they are included in the set.
- Multi-hop traversals are recoverable because each node's JSON encodes local connectivity (its immediate neighbors), and the global structure emerges from assembling them all.

The conjecture elevates duality from a practical optimization pattern to a theoretical principle: **the graph and the documents are not merely complementary views — they are informationally equivalent.**

If the Duality Conjecture holds, it has deep practical consequences:

- **Backup and portability:** A complete export of (tapestryKey, JSON) pairs is a lossless backup of the entire tapestry, independent of Neo4j.
- **Verification:** The two representations can be cross-checked — rebuild the graph from the JSONs and compare, or regenerate all JSONs from the graph and compare. Discrepancies indicate normalization errors.
- **Trust and interoperability:** When sharing data between tapestry instances, either representation suffices. A community can exchange serialized documents, graph fragments, or both — and the receiving instance can verify integrity by reconstructing the missing half.

## Design implications

- **Storage architecture:** Serialized representations are stored in an embedded LMDB key-value database, keyed by `tapestryKey`. This keeps Neo4j lean and focused on topology while providing fast reads for materialized views.
- **Rebuild strategy:** Materialized documents should be explicitly rebuilt when the underlying topology changes — not kept in automatic sync, which would add complexity and coupling.
- **Import pipeline:** Data arriving from the network in serialized form enters the key-value store first. Incorporation into the graph topology is a separate, deliberate step.
- **Lazy materialization:** Not every tapestryKey needs a populated LMDB entry. Serialized representations are computed on demand, prioritized by access frequency.

## See Also
- [Loose Consensus](./loose-consensus.md)
- [Set](./set.md)
- [JSON Schema](../node-types/json-schema.md)
- [Normalization](./normalization.md)
- [Property](./property.md)
