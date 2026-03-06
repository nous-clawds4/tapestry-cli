# Glossary

> Canonical definitions for the tapestry protocol. When in doubt, this is the authority.
> Terms are ordered conceptually rather than alphabetically, building from primitives to composites.

---

## Primitives

### Word
Any node in the concept graph whose data is structured as a JSON object. Every word has a `word` section containing universal metadata: `slug`, `name`, `title`, `description`, and `wordTypes`. Words are the atoms of the concept graph — if it's JSON and it's in the graph, it's a word.

### Word Type
A classification assigned to a word. A word may belong to multiple word types simultaneously; its `word.wordTypes` array declares them all. By convention, types are listed from coarse to fine (e.g., `["word", "property", "primaryProperty"]`). The word type determines which additional top-level JSON sections are present on the node.

---

## Identity & Naming Conventions

### slug
Kebab-case, human-readable, practically unique identifier (e.g., `primary-property-for-the-coffee-house-concept`). Used in URLs and as a human-friendly reference. Not the true unique identifier — that's the `uuid`.

### key
camelCase programmatic identifier used as the JSON property name in schemas (e.g., `coffeeHouse`). The primary property's `key` becomes the top-level property name in an element's JSON.

### name
Lowercase human-readable label (e.g., `primary property for the coffee house concept`). Lives in the `word` section. Not duplicated in type-specific sections.

### title
PascalCase / Title Case display name (e.g., `Coffee House`). Used for Neo4j node labels (per Neo4j convention) and UI display.

### uuid
The a-tag (`kind:pubkey:d-tag`) for replaceable nostr events. Derivable from the event envelope itself. This is the true unique identifier for a node. Not stored inside the node's own JSON content (that would be circular), but *is* included when referencing other nodes (e.g., in `coreMemberOf`).

---

## Class Threads

### Class Thread
The fundamental organizing structure of the concept graph. A directed path through the graph consisting of three phases:

1. **Initiation** — a single `IS_THE_CONCEPT_FOR` relationship from a Concept Header to a Superset
2. **Propagation** — zero or more `IS_A_SUPERSET_OF` relationships from Superset through Sets
3. **Termination** — a `HAS_ELEMENT` relationship from a Set (or Superset) to an Element

Every class thread emanates from a single Concept Header node. The collection of all nodes and edges traversed by all class threads from one Concept Header defines a concept.

### Class Thread Initiation
The `IS_THE_CONCEPT_FOR` relationship. Connects a Concept Header to its Superset. A node that is the source (nodeFrom) of this relationship is either a Concept Header or a proto concept.

### Class Thread Propagation
The `IS_A_SUPERSET_OF` relationship. Connects a Superset to a Set, or a Set to a smaller Set. Zero or more propagation steps may occur in a single class thread.

### Class Thread Termination
The `HAS_ELEMENT` relationship. Connects a Set (or Superset) to an Element. Can be defined explicitly (as a relationship in the graph) or *implicitly* inferred from the presence of a z-tag on the element pointing to the Concept Header's uuid.

---

## Concept

### Concept
Has three related meanings depending on context:

1. **The Concept Header node** — the single node from which all class threads emanate
2. **The Concept Graph** — the collection of all nodes and edges traversed by every class thread from that Concept Header, including the Superset, Sets, and Elements
3. **The full concept** — the union of the Concept Graph, the Core Nodes Graph, and the Property Tree Graph

Which meaning is intended is usually clear from context. When precision matters, use the specific term (Concept Header, Concept Graph, etc.).

**What makes something a concept is its position in the graph, not its event kind.** Specifically: a concept exists when a node is the source of a class thread initiation relationship (IS_THE_CONCEPT_FOR) *and* there are elements (explicit or implicit) reachable via class threads from that node.

### Proto Concept
A node that is the source of a class thread initiation relationship (IS_THE_CONCEPT_FOR) but has no elements — whether defined explicitly or implicitly. It has the *structure* of a concept but no *instances* yet.

### Concept Header
Also known as the *class thread header node*. A List Header that is the nodeFrom of a class thread initiation (IS_THE_CONCEPT_FOR) relationship. This is what distinguishes a Concept Header from a mere List Header — the presence of the IS_THE_CONCEPT_FOR edge elevates it.

---

## Graph Nodes

### Superset
The universal set for a concept — "the superset of all X." Connected to the Concept Header via IS_THE_CONCEPT_FOR (class thread initiation). All Sets and Elements of the concept are reachable from the Superset via propagation and termination edges. Word type: `superset`.

### Set
A subset of elements within a concept (e.g., "London coffee houses" within the coffee house concept). Connected to the Superset or another Set via IS_A_SUPERSET_OF (class thread propagation). Connected to Elements via HAS_ELEMENT (class thread termination). Word type: `set`.

### Element
An individual instance of a concept (e.g., a specific coffee house). The terminal node of a class thread. An element's membership in a concept can be declared explicitly (via a HAS_ELEMENT relationship) or implicitly (via a z-tag pointing to the Concept Header's uuid). Word type: the concept's own type (e.g., `coffeeHouse`).

### List Header
Any node that has List Items (elements). A List Header becomes a Concept Header when it is also the nodeFrom of a class thread initiation (IS_THE_CONCEPT_FOR) relationship.

### List Item
An element of a List Header. In the nostr context, a kind 39999 event whose z-tag points to a kind 39998 List Header.

---

## Core Nodes

### Core Nodes
The 8 nodes that constitute a fully-formed concept:

1. **Concept Header** — the root node; source of all class threads
2. **Superset** — the universal set of all elements
3. **JSON Schema** — the schema against which each element must validate
4. **Primary Property** — the root property for the JSON Schema
5. **Properties** — the set of all property nodes for this concept
6. **Property Tree Graph** — the graph containing the JSON Schema, Primary Property, and all downstream Property nodes
7. **Core Nodes Graph** — the graph containing all core nodes and their interconnections
8. **Concept Graph** — the graph containing the Concept Header, Superset, all Sets, and all Elements; imports the Core Nodes Graph and Property Tree Graph

---

## Properties

### Property
A node representing a field/attribute of a concept's elements. Contains a JSON Schema fragment that can be assembled into the concept's full schema. Word type: `property`. The `key` field becomes the property name in the parent JSON Schema.

### Primary Property
The root container property for a concept. All element data lives under the primary property's `key` in the JSON (e.g., all coffee house data lives under `coffeeHouse`). It is both a property and a special role, so its word types are `["word", "property", "primaryProperty"]`.

### Properties (Set)
A specific core node: the set of all property nodes for a concept. Word types: `["word", "set", "properties"]`. Not to be confused with the general term "properties."

---

## Graphs

### Property Tree Graph
A core node containing the JSON Schema, the Primary Property, and all downstream Property nodes for a concept. Represents the schema structure as a tree. Word types: `["word", "graph", "propertyTreeGraph"]`.

### Core Nodes Graph
A core node containing all 8 core nodes and their interconnections. Word types: `["word", "graph", "coreNodesGraph"]`.

### Concept Graph
A core node representing the collection of all nodes and edges traversed by the class threads of a concept. Contains the Concept Header, Superset, all Sets, and all Elements. Imports the Core Nodes Graph and Property Tree Graph. Word types: `["word", "graph", "conceptGraph"]`.

### Tapestry
A graph that validates against the tapestry rules of normalization; the union of many individual concept graphs. Word types: `["word", "graph", "tapestry"]`.

---

## Higher-Level Concepts

### Normalization
A set of rules that ensure the concept graph is well-formed. Documented in [NORMALIZATION.md](./NORMALIZATION.md). Normalization rules govern things like: every concept must have exactly one active JSON Schema, supersets must be properly chained, etc.

### Loose Consensus
The phenomenon where multiple users' Webs of Trust independently converge on shared lists without centralized coordination. Alice's and Bob's WoTs may overlap enough to produce compatible curated lists, even though neither dictates to the other. This is the mechanism by which decentralized knowledge emerges from individual curation.

---

*Last updated: 2026-03-06*
*Maintained by Nous 🧠 — corrections and refinements welcome*
