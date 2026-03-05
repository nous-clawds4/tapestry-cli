# Node Types (Word Types) — JSON Specification

This directory documents the canonical JSON structure for each node type in the tapestry concept graph.

## Graphs

A concept graph is a graph database imbued with a handful of principles that supply it with additional structure. As per standard definitions, **graphs** are a collection of **nodes** plus a collection of **relationships** that connect them.

Every node in the concept graph represents some piece of information. That piece of information may be stored inside the graph database, externally, or both. In principle, there is no restriction on the size, the data format (json, jpeg, etc), or the physical manifestation (digital electronic file, piece of paper, batch of neurons) of any given node.

## The Word System

We concern ourselves primarily with nodes that represent data files structered as JSON. Every such node is called a **word**. Every word is categorized into one or more **word types**, as presened below. Each word's JSON follows a layered structure where top-level keys correspond to the type(s) of the word:

- **`word`** — universal metadata present on every node (identity, slug, description, type list)
- **Type-specific sections** — one key per word type the node belongs to (e.g., `property`, `primaryProperty`, `classThreadHeader`)

The `word.wordTypes` array declares which sections are present. This mirrors the type hierarchy: a primary property node has `wordTypes: ["word", "primaryProperty", "property"]` because every primary property **is a** property, and every property **is a** word.

## Canonical Node Types

Any given concept starts with the node at the start of a class thread: **Class Thread Header** node.

A fully-formed concept has a total of **7 core nodes**:

| # | Node Type | wordType(s) | Description |
|---|-----------|-----------|-------------|
| 1 | **Class Thread Header** | `word, classThreadHeader` | The concept itself (e.g., "coffee house") |
| 2 | **Superset** | `word, superset` | "The superset of all coffee houses" |
| 3 | **JSON Schema** | `word, jsonSchema` | The JSON Schema for coffee house elements |
| 4 | **Primary Property** | `word, primaryProperty, property` | The root container property |
| 5 | **Core Nodes Graph** | `word, graph, coreNodesGraph` |  |
| 6 | **Class Threads Graph** | `word, graph, classThreadsGraph` |  |
| 7 | **Property Tree Graph** | `word, graph, propertyTreeGraph` |  |

In addition, an extended concept has these additional nodes:

| 1 | **Property** | `word, property` | A regular property of coffee houses |
| 2 | **Set** | `word, set` | A particular list/set of coffee houses |
| 3 | **Element** | `word, coffeeHouse` | An individual coffee house |

Other canonical node types:

| # | Node Type | wordTypes | Description |
|---|-----------|-----------|-------------|
| 1 | **Node** | `node` | Any node in the graph |
| 1 | **Word** | `word` | Any node whose data structure is a json object (as opposed to, for instance, a jpeg) |
| 1 | **Relationship** | `relationship` | Any relationship in the graph |
| 1 | **Graph** | `graph` | Any relationship in the graph |
| 1 | **Relationship Type** | `relationshipType` | Any type of graph database relationship |
| 1 | **Node Type** | `nodeType` | Any type of graph database relationship |

## Files

- [primary-property.md](./primary-property.md) — Primary Property node
- [class-thread-header.md](./class-thread-header.md) — *(planned)*
- superset.md — *(planned)*
- set.md — *(planned)*
- element.md — *(planned)*
- schema.md — *(planned)*
- property.md — *(planned)*

## Conventions

- **`slug`**: kebab-case, human-readable, practically unique (e.g., `primary-property-for-the-coffee-house-concept`)
- **`key`**: camelCase, used as the programmatic identifier / JSON Schema property name (e.g., `coffeeHouse`)
- **`name`**: lowercase human-readable (e.g., `primary property for the coffee house concept`)
- **`title`**: PascalCase / Title Case display name (e.g., `Coffee House`)
- **`uuid`**: the a-tag (`kind:pubkey:d-tag`) for replaceable events; derivable from the event itself
