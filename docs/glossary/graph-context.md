# Graph Context

The `graphContext` property is a top-level sibling of `word` inside a node's [tapestryJSON](./duality.md). It contains **local, dynamic metadata** describing the node's position and relationships within the local concept graph.

## The Separation Principle

Every tapestryJSON has (at minimum) two top-level sections:

- **`word`** — *What this thing IS.* Portable, self-contained data that makes sense on its own. Name, slug, description, properties, schema content. This is what you share with peers by wrapping it in a nostr event.

- **`graphContext`** — *Where this thing SITS in my graph.* Local metadata that describes the node's relationships, memberships, schema validation status, and identifiers within a specific tapestry instance.

The primary function of the tapestry protocol is for entities to learn from and communicate with their trusted peers. Peers share data in the form of tapestryJSON files, packaged inside nostr events. But the tapestryJSON stored locally and the JSON shared on the network are not always the same — because Alice's concept graph and Bob's concept graph are virtually never structured identically.

If Alice wants to share the concept of "Sheep Dog," she should be able to do so without necessarily sharing a list of every Sheep Dog in her graph. The data inside `graphContext` is the data that you **strip away** before packaging a tapestryJSON into a nostr event. It is local to your graph, frequently updated, and non-portable.

## What Goes in `graphContext`

The guiding question: *"Would this data still make sense if I sent it to someone with a different graph?"*

- **Yes** → it belongs in `word` (or a type-specific section like `set`, `superset`, `property`)
- **No** → it belongs in `graphContext`

The philosophy of `graphContext` is **verbose for performance**. The tradeoff: in exchange for verbosity, we make it maximally easy to look up data that is needed frequently or requires high performance. Graph traversals are powerful but expensive; caching their results in `graphContext` means most reads hit LMDB instead of Neo4j.

### Current Fields

| Field | Type | Description |
|-------|------|-------------|
| `identifiers` | object | The node's own identifiers in various systems |
| `identifiers.tapestryKey` | string | The node's permanent tapestryKey (LMDB key) |
| `concept` | object \| null | The parent concept this node belongs to (via class thread) |
| `memberOf` | array | Sets that contain this node as a direct element (reverse HAS_ELEMENT) |
| `parentJsonSchemas` | array | JSON Schemas this node should validate against, with cached validation results |
| `derivedAt` | number | Unix timestamp of the last derivation |

### `identifiers`

```json
"identifiers": {
  "tapestryKey": "39998:e527...:sheep-dog"
}
```

The `identifiers` object holds this node's own identifiers. Currently only `tapestryKey` is stored, but the structure allows for future additions (uuid, aTag, eventId, etc.) as needs arise.

### `parentJsonSchemas`

```json
"parentJsonSchemas": [
  {
    "tapestryKey": "39998:e527...:json-schema-for-dog",
    "conceptName": "dog",
    "conceptTapestryKey": "39998:e527...:dog",
    "lastValidated": 1711300000,
    "valid": true,
    "errors": []
  }
]
```

Each entry provides everything needed without a follow-up lookup:
- **Which schema** (`tapestryKey`) — direct reference to the JSON Schema node
- **Which concept** (`conceptName`, `conceptTapestryKey`) — denormalized for display and tracing
- **Cached validation** (`lastValidated`, `valid`, `errors`) — the result of validating this node's `word` data against the schema

Validation results are cached here for performance but are **not authoritative** — they reflect the state at `lastValidated` and may become stale when either the node's data or the schema changes. The UI can re-validate on demand.

## Full Example

A Set node for "border collie" within the concept "dog":

```json
{
  "word": {
    "slug": "border-collie",
    "name": "border collie",
    "description": "A highly intelligent herding breed.",
    "wordTypes": ["word", "set"]
  },
  "set": {
    "slug": "border-collie",
    "name": "border collie",
    "elements": [
      { "tapestryKey": "39998:e527...:lassie", "name": "lassie" }
    ],
    "directElements": [
      { "tapestryKey": "39998:e527...:lassie", "name": "lassie" }
    ],
    "childSets": [],
    "counts": { "directElements": 1, "allElements": 1, "childSets": 0 }
  },
  "graphContext": {
    "identifiers": {
      "tapestryKey": "39998:e527...:border-collie"
    },
    "concept": {
      "tapestryKey": "39998:e527...:dog",
      "name": "dog"
    },
    "memberOf": [
      {
        "tapestryKey": "39998:e527...:sheep-dog",
        "name": "sheep dog"
      }
    ],
    "parentJsonSchemas": [
      {
        "tapestryKey": "39998:e527...:json-schema-for-dog",
        "conceptName": "dog",
        "conceptTapestryKey": "39998:e527...:dog",
        "lastValidated": 1711300000,
        "valid": true,
        "errors": []
      }
    ],
    "derivedAt": 1711300000
  }
}
```

## Sharing: What Gets Stripped

When packaging a tapestryJSON for a nostr event:

1. **Keep:** `word`, type-specific sections (`set`, `superset`, `property`, etc.)
2. **Strip:** `graphContext` entirely

The recipient will compute their own `graphContext` when they import the data into their graph. Their concept structure, schema assignments, and set memberships will reflect *their* topology, not yours.

## Relationship to Duality

`graphContext` is a pure product of [duality](./duality.md) — it is the serialized representation of graph-positional information that would otherwise require traversals to compute. It exists solely for performance and convenience, and can always be recomputed from the topology.

If the [Duality Conjecture](./duality.md#the-duality-conjecture) holds, the `graphContext` of every node is fully recoverable from the complete set of `word` sections plus the graph structure.

## See Also
- [Duality](./duality.md)
- [Word](./word.md)
- [Set](./set.md)
- [Wrapped Data](./wrapped-data.md)
- [Loose Consensus](./loose-consensus.md)
