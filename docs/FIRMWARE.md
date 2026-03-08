# The Tapestry Firmware

## What Is Firmware?

The tapestry firmware is the canonical set of JSON definitions that describe the tapestry protocol's own meta-concepts — everything the system needs to know about itself before it can create, validate, or manage concepts.

The term "firmware" is used deliberately. Like hardware firmware, it sits between the fixed logic of the code and the dynamic data of the graph. It defines the protocol's self-knowledge: what a concept looks like, what core nodes it has, how they're wired together, what validation means.

Previously called "BIOS" (and the bootstrap scripts in `src/bios/` retain that name), "firmware" better captures the idea: a versioned, swappable layer of foundational definitions that the code reads at runtime.

## Where Does the Firmware Live?

The firmware lives in three places simultaneously:

1. **The firmware directory** (`firmware/active/`) — the single source of truth. JSON files defining every meta-concept's structure. The code reads from here.
2. **The code** — reads the firmware directory and acts on it. Creates concepts, validates graphs, runs normalization — all guided by what the firmware says.
3. **The graph** — the firmware concepts instantiated as actual nostr events in strfry and nodes in Neo4j. Created by the bootstrap process from the firmware files.

The firmware directory is primary. The code interprets it. The graph is a downstream artifact of applying firmware to a fresh instance.

## Versioning

```
firmware/
  versions/
    v0.1.0/
    v0.1.1/
    v0.2.0-experimental/
  active/              ← symlink to the current version
```

The code always reads from `firmware/active/`. Switching firmware versions:

```bash
cd firmware && ln -sf versions/v0.1.1 active
```

Version numbering follows semver principles:
- **Patch** (v0.1.0 → v0.1.1): updated descriptions, fixed typos, added properties to existing concepts. Non-breaking.
- **Minor** (v0.1.x → v0.2.0): new concepts added, new relationship types. Additive, generally non-breaking.
- **Major** (v0.x → v1.0): structural changes — different core node count, renamed relationship types, changed word section structure. Breaking.

## Layer 1: Firmware as Content

Layer 1 is the current goal. In Layer 1:

**The firmware files define the *content* of each meta-concept:**
- The word JSON for each core node (slug, name, title, description, wordTypes, coreMemberOf)
- The JSON Schema for each concept
- The property definitions
- The descriptions and naming conventions

**The code hardwires the *structure*:**
- The names of the 8 core node types for word-based concepts: Concept Header, Superset, JSON Schema, Primary Property, Properties, Property Tree Graph, Core Nodes Graph, Concept Graph
- The names of the 5 core node types for image-based concepts: Concept Header, Superset, Concept Graph, Core Nodes Graph, Image Validation Script
- The relationship types that wire core nodes to their Concept Header (IS_THE_CONCEPT_FOR, IS_THE_JSON_SCHEMA_FOR, IS_THE_PRIMARY_PROPERTY_FOR, IS_THE_PROPERTIES_SET_FOR, IS_THE_PROPERTY_TREE_GRAPH_FOR, IS_THE_CORE_GRAPH_FOR, IS_THE_CONCEPT_GRAPH_FOR)
- The class thread relationship types (IS_THE_CONCEPT_FOR, IS_A_SUPERSET_OF, HAS_ELEMENT)
- The property tree relationship types (IS_A_PROPERTY_OF, ENUMERATES)
- The distinction between node types (word vs. image)
- The structure of the `word` section (slug, name, title, description, wordTypes, coreMemberOf)

In Layer 1, changing any of the above requires changing the code. The firmware files are the *data* that the hardwired code operates on.

### What Layer 1 Gives Us

- **Single source of truth** — one place to look for "what does a superset's JSON look like?"
- **Versionable** — we can track how the protocol's self-definition evolves
- **Swappable** — point `active/` at a different version to change all concept definitions at once
- **Bootstrap from files** — spin up a fresh tapestry instance by reading firmware, no hardcoded strings scattered through the codebase
- **Testable** — validate firmware files against their own schemas before deploying

### Layer 1 Does NOT Require Install Scripts

Updating firmware in Layer 1 means swapping the symlink. The code reads from `firmware/active/` on every operation. There is no "install firmware" step beyond the file swap — and, if the graph needs to reflect the updated firmware, re-running the bootstrap (`tapestry bios` or equivalent).

## Layer 2: Firmware as Structure (Future)

Layer 2 is the radical extension. In Layer 2, the firmware defines not just the content but the *structure* of the protocol itself. The code becomes a generic firmware interpreter rather than a hardwired concept engine.

### What Layer 2 Would Change

Instead of the code knowing "a word-based concept has 8 core nodes," the firmware would declare:

```json
{
  "nodeType": "word",
  "coreNodes": [
    { "type": "conceptHeader", "relationship": "IS_THE_CONCEPT_FOR", "direction": "outward" },
    { "type": "superset", "relationship": "IS_THE_CONCEPT_FOR", "direction": "inward" },
    { "type": "jsonSchema", "relationship": "IS_THE_JSON_SCHEMA_FOR", "direction": "inward" },
    { "type": "primaryProperty", "relationship": "IS_THE_PRIMARY_PROPERTY_FOR", "direction": "inward" },
    ...
  ]
}
```

And the `create-concept` code would read this declaration and dynamically build whatever skeleton the firmware defines.

### Examples of Boundaries Layer 2 Would Push

1. **Change the number of core nodes.** Add a 9th core node (e.g., a "Changelog Graph" that tracks concept evolution) by adding it to the firmware — no code change needed.

2. **Add a new node type.** Introduce "video" alongside word and image. Define its core nodes, its validation mechanism, its tag type — all in firmware. The code reads the definition and creates video-based concepts.

3. **Rename a relationship type.** Change `IS_THE_CONCEPT_FOR` to `INITIATES_CLASS_THREAD`. Update the firmware file; the code reads the new name.

4. **Change the word section structure.** Add a required `version` field to every word's `word` section. The firmware declares the new schema; the code enforces it.

5. **Merge or split core nodes.** Combine Properties and Property Tree Graph into a single node, or split Core Nodes Graph into two. The firmware declares the new skeleton; the code adapts.

6. **Define entirely new concept skeleton patterns.** A "lightweight concept" with only 3 core nodes (header, superset, validation). Defined in firmware, not special-cased in code.

### The Layer 2 Bootstrapping Paradox

Layer 2 has a beautiful recursion: the firmware that defines what a concept looks like is itself a set of concepts. The firmware interpreter needs to read firmware to know how to read firmware. This is resolved the same way real firmware handles it — a minimal, truly hardwired bootstrap (Layer 1) that can read enough firmware to bootstrap Layer 2.

In practice, this means Layer 1 never fully disappears. It becomes the minimal kernel that Layer 2 builds on top of.

### When to Pursue Layer 2

Layer 2 should wait until Layer 1 is battle-tested. Specifically:
- The firmware directory structure is stable
- Multiple tapestry instances have been bootstrapped from firmware
- We've done at least one firmware version bump (v0.1.0 → v0.1.1) and confirmed the swap works cleanly
- We've hit a concrete case where hardwired structure is limiting us

Layer 2 is not a rewrite — it's a gradual extraction. Each time we find a hardwired structural assumption, we ask: "Could this be in the firmware instead?" Over time, the hardwired kernel shrinks and the firmware grows.

## Firmware v0.1.0 — Scope

The first firmware version will contain:

### Concept Definitions (one JSON file per meta-concept)
Each file contains the complete word JSON for all core nodes of that concept:
- word, superset, set, node-type, relationship-type, relationship, property, json-schema, json-data-type, graph, graph-type, list, validation-tool, validation-tool-type, image, image-type, image-validation-script, tapestry, concept-header, primary-property, properties, property-tree-graph, core-nodes-graph, concept-graph

### Element Definitions
Pre-defined elements for BIOS concepts:
- JSON data types: string, number, integer, boolean, object, array, null
- Node types: word, image
- Relationship types: IS_THE_CONCEPT_FOR, IS_A_SUPERSET_OF, HAS_ELEMENT, IS_THE_JSON_SCHEMA_FOR, IS_THE_PRIMARY_PROPERTY_FOR, IS_THE_PROPERTIES_SET_FOR, IS_THE_PROPERTY_TREE_GRAPH_FOR, IS_THE_CORE_GRAPH_FOR, IS_THE_CONCEPT_GRAPH_FOR, IS_A_PROPERTY_OF, ENUMERATES
- Graph types: core-nodes-graph, concept-graph, property-tree-graph
- Validation tool types: json-schema, image-validation-script

### Manifest
A `manifest.json` listing all files, their ordering (for bootstrap dependency resolution), and firmware metadata (version, date, description).

---

*This document describes the vision. Implementation begins with building the firmware directory structure and populating it from the existing node-type docs.*
