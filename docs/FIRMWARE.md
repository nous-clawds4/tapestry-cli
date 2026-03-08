# The Tapestry Firmware

## What Is Firmware?

The tapestry firmware is the canonical set of JSON definitions that describe the tapestry protocol's own meta-concepts — everything the system needs to know about itself before it can create, validate, or manage concepts.

The term "firmware" is used deliberately. Like hardware firmware, it sits between the fixed logic of the code and the dynamic data of the graph. It defines the protocol's self-knowledge: what a concept looks like, what core nodes it has, how they're wired together, what validation means.

Previously called "BIOS" (and the bootstrap scripts in `src/bios/` retain that name for now), "firmware" better captures the idea: a versioned, swappable layer of foundational definitions that the code reads at runtime.

## Where Does the Firmware Live?

The firmware lives in the **tapestry server repo** (`tapestry/firmware/`), because the server is what reads it at runtime. The CLI is a thin client that calls the server — it doesn't need direct access to firmware files.

The firmware exists in three places simultaneously:

1. **The firmware directory** (`firmware/active/`) — the single source of truth. JSON files defining every meta-concept's structure. The server reads from here at runtime.
2. **The code** — reads the firmware directory and acts on it. Creates concepts, validates graphs, runs normalization — all guided by what the firmware says.
3. **The graph** — the firmware concepts instantiated as actual nostr events in strfry and nodes in Neo4j. Created by the bootstrap process from the firmware files.

The firmware directory is primary. The code interprets it. The graph is a downstream artifact.

**Note:** The server code does not depend on the graph containing the meta-concepts. You can create "burger joints" on an empty graph — the `create-concept` endpoint reads its structural knowledge from the firmware, not from Neo4j. The bootstrap process populates the graph with the meta-concepts so they're visible and queryable, but the code doesn't require them.

## Versioning

```
firmware/
  versions/
    v0.0.1/
    v0.0.2/
    v0.0.1-experimental/
  active/              ← symlink to the current version
```

The code always reads from `firmware/active/`. Switching firmware versions:

```bash
cd firmware && ln -sf versions/v0.0.1 active
```

Version numbering follows semver principles:
- **Patch** (v0.0.1 → v0.0.2): updated descriptions, fixed typos, added properties to existing concepts. Non-breaking.
- **Minor** (v0.0.x → v0.1.0): new concepts added, new relationship types. Additive, generally non-breaking.
- **Major** (v0.x → v1.0): structural changes — different core node count, renamed relationship types, changed word section structure. Breaking.

## Design Decisions

### Slugs, Not Names

The firmware keys everything by **slug** (kebab-case for concepts, SCREAMING_SNAKE_CASE for relationship types). Slugs are the programmatic identifiers: deterministic, unambiguous, stable. Display names come from the firmware files and can change without affecting the code.

The code hardwires slugs like `superset`, `json-schema`, `concept-header`. It never hardwires display names.

### Canonical Slugs vs. Aliases

Relationship types have two identifiers:

- **Canonical slug** — the protocol-level name hardwired in the firmware. Example: `CLASS_THREAD_INITIATION`
- **Alias** — the name used in Neo4j and human-facing contexts. Example: `IS_THE_CONCEPT_FOR`

The code knows only the canonical slug. When creating a relationship in Neo4j, it reads the firmware to get the alias. This means renaming a relationship in the graph (e.g., `IS_THE_CONCEPT_FOR` → `INITIATES`) requires changing only the firmware file, not the code.

The three class thread relationship types use canonical slugs that describe their role:

| Canonical Slug | Alias (Neo4j) | Role |
|---|---|---|
| `CLASS_THREAD_INITIATION` | `IS_THE_CONCEPT_FOR` | Concept Header → Superset |
| `CLASS_THREAD_PROPAGATION` | `IS_A_SUPERSET_OF` | Superset/Set → Set |
| `CLASS_THREAD_TERMINATION` | `HAS_ELEMENT` | Superset/Set → Element |

### Manifest as Self-Description

Each firmware version includes a `manifest.json` that declares what must exist for the firmware to function. This replaces and extends `defaults.json`. Each entry has a slug and a file pointer:

```json
{
  "version": "0.0.1",
  "concepts": [
    { "slug": "node-type", "file": "./concepts/node-type.json" },
    { "slug": "superset", "file": "./concepts/superset.json" }
  ],
  "relationshipTypes": [
    { "slug": "CLASS_THREAD_INITIATION", "file": "./relationship-types/class-thread-initiation.json" },
    { "slug": "CLASS_THREAD_PROPAGATION", "file": "./relationship-types/class-thread-propagation.json" }
  ]
}
```

File pointers default to the local firmware directory (`"./concepts/superset.json"`), but can also reference a nostr event by UUID — enabling the firmware to point to live graph data when available.

## Layer 1: Firmware as Content

Layer 1 is the current goal. In Layer 1:

**The firmware files define the *content* of each meta-concept:**
- The word JSON for each core node (slug, name, title, description, wordTypes, coreMemberOf)
- The JSON Schema for each concept
- The property definitions
- The descriptions and naming conventions
- The alias names for relationship types

**The code hardwires the *structure*:**
- The slugs of the 8 core node types for word-based concepts: `concept-header`, `superset`, `json-schema`, `primary-property`, `properties`, `property-tree-graph`, `core-nodes-graph`, `concept-graph`
- The slugs of the 5 core node types for image-based concepts: `concept-header`, `superset`, `concept-graph`, `core-nodes-graph`, `image-validation-script`
- The canonical slugs of relationship types (CLASS_THREAD_INITIATION, etc.) and core node wiring relationships
- The distinction between node types (word vs. image)
- The structure of the `word` section (slug, name, title, description, wordTypes, coreMemberOf)

In Layer 1, changing any of the above requires changing the code. The firmware files are the *data* that the hardwired code operates on.

### What Layer 1 Gives Us

- **Single source of truth** — one place to look for "what does a superset's JSON look like?"
- **Versionable** — we can track how the protocol's self-definition evolves
- **Swappable** — point `active/` at a different version to change all concept definitions at once
- **Bootstrap from files** — spin up a fresh tapestry instance by reading firmware, no hardcoded strings scattered through the codebase
- **Testable** — validate firmware files against their own schemas before deploying

### Updating Firmware in Layer 1

Updating firmware means swapping the `active` symlink to a new version. The server reads from `firmware/active/` on every operation — no install script needed.

To populate a fresh graph with the meta-concepts, run the bootstrap process (currently `tapestry bios` / `run-all.js`), which reads from the firmware and creates the nostr events.

## Layer 2: Firmware as Structure (Future)

Layer 2 is the radical extension. In Layer 2, the firmware defines not just the content but the *structure* of the protocol itself. The code becomes a generic firmware interpreter rather than a hardwired concept engine.

### What Layer 2 Would Change

Instead of the code knowing "a word-based concept has 8 core nodes," the firmware would declare:

```json
{
  "nodeType": "word",
  "coreNodes": [
    { "slug": "concept-header", "relationship": "CLASS_THREAD_INITIATION", "direction": "outward" },
    { "slug": "superset", "relationship": "CLASS_THREAD_INITIATION", "direction": "inward" },
    { "slug": "json-schema", "relationship": "CORE_NODE_JSON_SCHEMA", "direction": "inward" },
    ...
  ]
}
```

And the `create-concept` code would read this declaration and dynamically build whatever skeleton the firmware defines.

### Examples of Boundaries Layer 2 Would Push

1. **Change the number of core nodes.** Add a 9th core node (e.g., a "Changelog Graph" that tracks concept evolution) by adding it to the firmware — no code change needed.

2. **Add a new node type.** Introduce "video" alongside word and image. Define its core nodes, its validation mechanism, its tag type — all in firmware. The code reads the definition and creates video-based concepts.

3. **Rename a relationship alias.** Change `IS_THE_CONCEPT_FOR` to `INITIATES_CLASS_THREAD`. Update the firmware file; the code reads the new alias. The canonical slug `CLASS_THREAD_INITIATION` stays the same.

4. **Change the word section structure.** Add a required `version` field to every word's `word` section. The firmware declares the new schema; the code enforces it.

5. **Merge or split core nodes.** Combine Properties and Property Tree Graph into a single node, or split Core Nodes Graph into two. The firmware declares the new skeleton; the code adapts.

6. **Define entirely new concept skeleton patterns.** A "lightweight concept" with only 3 core nodes (header, superset, validation). Defined in firmware, not special-cased in code.

### The Layer 2 Bootstrapping Paradox

Layer 2 has a beautiful recursion: the firmware that defines what a concept looks like is itself a set of concepts. The firmware interpreter needs to read firmware to know how to read firmware.

This is resolved the same way real firmware handles it — a minimal, truly hardwired bootstrap (Layer 1) that can read enough firmware to bootstrap Layer 2. In practice, Layer 1 never fully disappears. It becomes the minimal kernel that Layer 2 builds on top of.

### When to Pursue Layer 2

Layer 2 should wait until Layer 1 is battle-tested:
- The firmware directory structure is stable
- Multiple tapestry instances have been bootstrapped from firmware
- We've done at least one firmware version bump (v0.0.1 → v0.0.2) and confirmed the swap works cleanly
- We've hit a concrete case where hardwired structure is limiting us

Layer 2 is not a rewrite — it's a gradual extraction. Each time we find a hardwired structural assumption, we ask: "Could this be in the firmware instead?" Over time, the hardwired kernel shrinks and the firmware grows.

## Firmware v0.0.1 — Scope

The first firmware version will contain:

### Concept Definitions (one JSON file per meta-concept)
Each file contains the complete word JSON for all core nodes of that concept:
- word, superset, set, concept-header, node-type, relationship-type, relationship, property, primary-property, properties, json-schema, json-data-type, graph, graph-type, property-tree-graph, core-nodes-graph, concept-graph, list, validation-tool, validation-tool-type, image, image-type, image-validation-script, tapestry

### Relationship Type Definitions
Pre-defined relationship types with canonical slugs and aliases:

**Class Thread:**
- `CLASS_THREAD_INITIATION` (alias: `IS_THE_CONCEPT_FOR`)
- `CLASS_THREAD_PROPAGATION` (alias: `IS_A_SUPERSET_OF`)
- `CLASS_THREAD_TERMINATION` (alias: `HAS_ELEMENT`)

**Core Node Wiring:**
- `CORE_NODE_JSON_SCHEMA` (alias: `IS_THE_JSON_SCHEMA_FOR`)
- `CORE_NODE_PRIMARY_PROPERTY` (alias: `IS_THE_PRIMARY_PROPERTY_FOR`)
- `CORE_NODE_PROPERTIES` (alias: `IS_THE_PROPERTIES_SET_FOR`)
- `CORE_NODE_PROPERTY_TREE_GRAPH` (alias: `IS_THE_PROPERTY_TREE_GRAPH_FOR`)
- `CORE_NODE_CORE_GRAPH` (alias: `IS_THE_CORE_GRAPH_FOR`)
- `CORE_NODE_CONCEPT_GRAPH` (alias: `IS_THE_CONCEPT_GRAPH_FOR`)

**Property Tree:**
- `PROPERTY_MEMBERSHIP` (alias: `IS_A_PROPERTY_OF`)
- `PROPERTY_ENUMERATION` (alias: `ENUMERATES`)

### Element Definitions
Pre-defined elements for BIOS concepts:
- JSON data types: string, number, integer, boolean, object, array, null
- Node types: word, image
- Graph types: core-nodes-graph, concept-graph, property-tree-graph
- Validation tool types: json-schema, image-validation-script

### Manifest
A `manifest.json` listing all files, their slugs, ordering (for bootstrap dependency resolution), and firmware metadata (version, date, description).

---

*This document describes the vision and design decisions. Implementation begins with building the firmware directory in the tapestry server repo and populating it from the existing node-type docs.*
