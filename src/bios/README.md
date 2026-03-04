# BIOS Bootstrap Scripts

These scripts bootstrap a fresh Tapestry instance by creating the 11 canonical
meta-concepts that define the concept graph's structure.

## What each script creates

Each script calls `createConcept()` which creates the **full skeleton** for a
concept (11 nostr events):

| # | Events | Description |
|---|--------|-------------|
| 1 | ListHeader / ClassThreadHeader | The concept definition (kind 39998) |
| 2 | Superset | Root of the class thread hierarchy (kind 39999) |
| 3 | JSON Schema | Defines horizontal structure of elements (kind 39999) |
| 4 | Core Nodes Graph | Infrastructure wiring graph (kind 39999) |
| 5 | Class Threads Graph | Vertical hierarchy graph (kind 39999) |
| 6 | Property Tree Graph | Horizontal properties graph (kind 39999) |
| 7–11 | 5 Relationship events | Wiring between the above nodes |

All 6 primary nodes get a `json` tag with structured data.

## Script sequence

| Script | Concept | Notes |
|--------|---------|-------|
| `00-reset.js` | — | Clears Neo4j and strfry (destructive!) |
| `01-node-types.js` | node type | Class Thread Anomaly (Rule 9) |
| `02-supersets.js` | superset | Self-referential: its superset is an element of itself |
| `03-sets.js` | set | Intermediate grouping nodes |
| `04-relationships.js` | relationship | Directed edges between nodes |
| `05-relationship-types.js` | relationship type | IS_THE_CONCEPT_FOR, HAS_ELEMENT, etc. |
| `06-properties.js` | property | Horizontal structure fields |
| `07-json-schemas.js` | JSON schema | One active schema per concept (Rule 11) |
| `08-lists.js` | list | Synonym for "concept" |
| `09-json-data-types.js` | JSON data type | **Also creates 7 elements:** string, number, integer, boolean, object, array, null |
| `10-graph-types.js` | graph type | Core nodes, class threads, property tree |
| `11-graphs.js` | graph | Graph instances with JSON structure |

## Running

```bash
# Run all scripts in sequence:
node src/bios/run-all.js

# Resume from a specific script:
node src/bios/run-all.js --from 5

# Run a single script:
node src/bios/01-node-types.js
```

## CLI equivalents

Each script is equivalent to running:

```bash
tapestry concept create "<name>" --plural "<plural>" --description "..." --slug <slug>
```

Script 09 also runs:
```bash
tapestry concept add "JSON data type" "string" --description "..."
tapestry concept add "JSON data type" "number" --description "..."
# ... etc for all 7 data types
```

## Event counts

- Scripts 01–08, 10–11: 11 events each (full skeleton)
- Script 09: 11 + 7 = 18 events (skeleton + 7 data type elements)
- **Total: 128 events** (11 × 11 + 7)

## Design notes

- All concepts use the Tapestry Assistant as signer (TA pubkey `2d1fe9d3...`)
- Config defaults in `src/lib/config.js` point to the TA's canonical UUIDs
- The bootstrap problem (concepts referencing each other before they exist)
  is resolved by creating all skeletons first, then normalizing
- `createConcept()` lives in `src/lib/concept.js` — BIOS helpers.js is a thin wrapper
