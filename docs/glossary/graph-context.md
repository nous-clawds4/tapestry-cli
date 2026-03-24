# Graph Context

The `graphContext` property is a top-level sibling of `word` inside a node's [tapestryJSON](./duality.md). It contains **local, dynamic metadata** describing the node's position and relationships within the local concept graph.

## The Separation Principle

Every tapestryJSON has (at minimum) two top-level sections, and may have more:

- **`word`** — *What this thing IS.* Portable, self-contained identity data: name, slug, description, wordTypes. Always shared.

- **`<conceptSlug>`** — *What this thing IS in the context of a specific concept.* Concept-scoped data blocks, keyed by the concept's slug (e.g., `sheepDog`, `dog`, `animal`). Each block contains properties specific to that concept's schema. **Optionally shared** — the sender chooses which concept contexts to include.

- **`graphContext`** — *Where this thing SITS in my graph.* Local metadata describing the node's relationships, memberships, element lists, schema validation status, and identifiers. **Never shared** — stripped before packaging into a nostr event.

### Why Three Tiers?

The primary function of the tapestry protocol is for entities to learn from and communicate with their trusted peers. Peers share data in the form of tapestryJSON files, packaged inside nostr events. But the tapestryJSON stored locally and the JSON shared on the network are not always the same — because Alice's concept graph and Bob's concept graph are virtually never structured identically.

**Selective sharing** is fundamental. If Alice wants to share her dog Spot as a sheep dog, she sends `word` + `sheepDog`. She does *not* need to include the `dog`, `animal`, or `organism` blocks — Bob can infer those from his own concept graph. And she certainly strips `graphContext`, because her element lists, set memberships, and schema assignments are artifacts of *her* topology.

This means:
1. **`word`** is typically shared (universal identity)
2. **Concept-scoped blocks** are shared at the sender's discretion (selective context)
3. **`graphContext`** is typically not shared (local-only, stripped before export)

## What Goes in `graphContext`

The guiding question: *"Would this data still make sense if I sent it to someone with a different graph?"*

- **Yes** → it belongs in `word` or a concept-scoped block
- **No** → it belongs in `graphContext`

The philosophy of `graphContext` is **verbose for performance**. The tradeoff: in exchange for verbosity, we make it maximally easy to look up data that is needed frequently or requires high performance. Graph traversals are powerful but expensive; caching their results in `graphContext` means most reads hit LMDB instead of Neo4j.

### Current Fields

| Field | Type | Description |
|-------|------|-------------|
| `identifiers` | object | The node's own identifiers in various systems |
| `identifiers.tapestryKey` | string | The node's permanent tapestryKey (LMDB key) |
| `concept` | object \| null | The parent concept this node belongs to (via class thread) |
| `memberOf` | array | Sets that contain this node as a direct element (reverse HAS_ELEMENT) |
| `parentSets` | array | Sets that this node is a direct subset of (reverse IS_A_SUPERSET_OF) |
| `childSets` | array | Sets that are direct subsets of this node (forward IS_A_SUPERSET_OF) |
| `elements` | object | Elements of this node: `direct`, `all`, and `counts` |
| `elements.direct` | array | Elements connected by direct HAS_ELEMENT |
| `elements.all` | array | All elements reachable via class thread (recursive) |
| `elements.counts` | object | `{ direct, all }` — element counts for quick display |
| `parentJsonSchemas` | array | JSON Schemas this node should validate against, with cached validation |
| `derivedAt` | number | Unix timestamp of the last derivation |

### `identifiers`

```json
"identifiers": {
  "tapestryKey": "39998:e527...:sheep-dog"
}
```

The `identifiers` object holds this node's own identifiers. Currently only `tapestryKey` is stored, but the structure allows for future additions (uuid, aTag, eventId, etc.) as needs arise.

### `elements`

```json
"elements": {
  "direct": [
    { "tapestryKey": "39998:e527...:lassie", "name": "lassie", "slug": "lassie" }
  ],
  "all": [
    { "tapestryKey": "39998:e527...:lassie", "name": "lassie", "slug": "lassie" },
    { "tapestryKey": "39998:e527...:rex", "name": "rex", "slug": "rex" }
  ],
  "counts": { "direct": 1, "all": 2 }
}
```

Element lists belong in `graphContext` because Alice's sheep dogs and Bob's sheep dogs are almost certainly different. When sharing the concept of "sheep dog," you share the *definition* (word + concept-scoped properties), not your personal curated list.

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
- **Cached validation** (`lastValidated`, `valid`, `errors`) — the result of validating this node's data against the schema

Validation results are cached here for performance but are **not authoritative** — they reflect the state at `lastValidated` and may become stale when either the node's data or the schema changes. The UI can re-validate on demand.

## Full Example

The Superset node for the concept of "border collies":

```json
{
  "word": {
    "slug": "the-superset-for-the-concept-of-border-collies",
    "name": "the superset for the concept of border collies",
    "wordTypes": ["word", "superset", "set"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-border-collies",
        "uuid": "39998:abcde12345...:border-collies"
      }
    ]
  },
  "superset": {
    "slug": "superset-for-the-concept-of-border-collies",
    "name": "superset fot the concept of border collies"
  },
  "set": {
    "slug": "border-collies",
    "name": "border collies"
  },
  "graphContext": {
    "identifiers": {
      "uuid": "39998:e527...:border-collie",
      "tapestryKey": "abcde12345..."
    },
    "parentSets": {
      "direct": [
        {
          "tapestryKey": "abcde12345...",
          "name": "herding dogs"
        },
        {
          "tapestryKey": "abcde12345...",
          "name": "dogs"
        }
      ],
      "indirect": [
        {
          "tapestryKey": "abcde12345...",
          "name": "animals"
        },
        {
          "tapestryKey": "abcde12345...",
          "name": "organisms"
        }
      ]
    },
    "childSets": {
      "direct": [],
      "indirect": []
    },
    "elements": {
      "direct": [
        { "tapestryKey": "abcde12345...", "name": "Spot", "slug": "spot" }
      ],
      "indirect": [
        { "tapestryKey": "abcde12345...", "name": "Lassie", "slug": "lassie" }
      ]
    },
    "elementOf": {
      "direct": [
        { "tapestryKey": "abcde12345...", "name": "superset", "slug": "superset" }
      ],
      "indirect": [
        { "tapestryKey": "abcde12345...", "name": "word", "slug": "word" },
        { "tapestryKey": "abcde12345...", "name": "set", "slug": "set" }
      ]
    },
    "parentJsonSchemas": [
      {
        "uuid": "39998:e123...:json-schema-for-the-concept-of-words",
        "conceptName": "word",
        "tapestryKey": "063588e3-...",
        "lastValidated": 1711300000,
        "valid": true,
        "errors": []
      },
      {
        "uuid": "39998:e527...:json-schema-for-the-concept-of-supersets",
        "conceptName": "superset",
        "tapestryKey": "abcd1234-...",
        "lastValidated": 1711300000,
        "valid": true,
        "errors": []
      },
      {
        "uuid": "39998:e527...:json-schema-for-the-concept-of-sets",
        "conceptName": "set",
        "tapestryKey": "abcd1234-...",
        "lastValidated": 1711300000,
        "valid": true,
        "errors": []
      }
    ],
    "derivedAt": 1711300000
  }
}
```

## Sharing: The Three-Tier Model

When packaging a tapestryJSON for a nostr event:

1. **Always include:** `word` — the universal identity
2. **Selectively include:** concept-scoped blocks (`sheepDog`, `dog`, etc.) — sender's choice based on what context they want to share
3. **Always strip:** `graphContext` — local graph metadata

The recipient computes their own `graphContext` when they import the data. Their element lists, set memberships, and schema assignments will reflect *their* topology, not yours. And they may derive additional concept-scoped blocks that exist in their graph but not yours — if Alice's tapestry has an "animal" concept with "dog" as a subset, she can derive an `animal` block for Spot even if you never sent one.

## Relationship to Duality

`graphContext` is a pure product of [duality](./duality.md) — it is the serialized representation of graph-positional information that would otherwise require traversals to compute. It exists solely for performance and convenience, and can always be recomputed from the topology.

If the [Duality Conjecture](./duality.md#the-duality-conjecture) holds, the `graphContext` of every node is fully recoverable from the complete set of `word` sections plus the graph structure.

## See Also
- [Duality](./duality.md)
- [Word](./word.md)
- [Set](./set.md)
- [Wrapped Data](./wrapped-data.md)
- [Loose Consensus](./loose-consensus.md)
