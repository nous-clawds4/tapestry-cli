# Node Types (Word Types) — JSON Specification

This directory documents the canonical JSON structure for each node type in the tapestry concept graph.

## Graphs

A concept graph is a graph database imbued with a handful of principles that supply it with additional structure. As per standard definitions, **graphs** are a collection of **nodes** plus a collection of **relationships** that connect them.

Every node in the concept graph represents some piece of information. That piece of information may be stored inside the graph database, externally, or both. In principle, there is no restriction on the size, the data format (json, jpeg, etc), or the physical manifestation (digital electronic file, piece of paper, batch of neurons) of any given node.

## The Word System

We concern ourselves primarily with nodes that represent data files structered as JSON. Every such node is called a **word**. Every word is categorized into one or more **word types**, as presened below. Each word's JSON follows a layered structure where top-level keys correspond to the type(s) of the word:

- **`word`** — universal metadata present on every node (identity, slug, description, type list)
- **Type-specific sections** — one key per word type the node belongs to (e.g., `property`, `primaryProperty`, `classThreadHeader`)

The `word.wordTypes` array declares which sections are present. By convention, they are ordered from coarse grained to fine grained, although this convention is not strict. For example: a primary property node has `wordTypes: ["word", "property", "primaryProperty"]` because every primary property **is a** property, and every property **is a** word.

## Canonical Word Types

Class threads and concepts are defined as per the tapestry protocol. Canonical word types are the ones that are required for the basic functioning of the concept graph.

### Core Nodes

Any given concept starts with the node at the start of a class thread: **Class Thread Header** node. A fully-formed concept contains the Class Thread Header node plus 7 more for a total of **8 core nodes**:

| # | Word Type | wordType(s) | Description |
|---|-----------|-----------|-------------|
| 1 | [**Class Thread Header**](./class-thread-header.md) | `word, classThreadHeader` | The concept itself |
| 2 | [**Superset**](,/superset.md) | `word, superset` | The superset of all elements of the concept |
| 3 | [**JSON Schema**](./json-schema.md) | `word, jsonSchema` | The JSON Schema against which each element must validate |
| 4 | [**Primary Property**](./primary-property.md) | `word, property, primaryProperty` | The root property for the JSON Schema |
| 5 | [**Structured Elements Graph**](./structured-elements-graph.md) | `word, graph, structuredElementsGraph` | The graph that contains the Superset, all Set nodes, and all Elements of the concept |
| 6 | [**Property Tree Graph**](./property-tree-graph.md) | `word, graph, propertyTreeGraph` | The graph that containst the JSON Schema, the Primary Property, and all downstream Property nodes |
| 7 | [**Concept Graph**](./concept-graph.md) | `word, graph, conceptGraph` | A graph that contains all 7 core nodes and their interconnections, and which also imports the superset threads and property tree graphs |
| 8 | [**Properties**](./properties.md) | `word, set, properties` | The set of property nodes for this concept |

In addition, an extended concept has these additional nodes:

| # | Word Type | wordType(s) | Description |
|---|-----------|-----------|-------------|
| 1 | [**Property**](./property.md) | `word, property` | A regular property of coffee houses |
| 2 | [**Set**](./set.md) | `word, set` | A particular list/set of coffee houses |
| 3 | [**Element**](./element.md) | `word, coffeeHouse` | An individual coffee house |

Technically speaking, the formal definition of a concept is in terms of a graph: it is *the collection of all core + extended nodes and edges* that make up the graph. Informally, the word "concept" may sometimes be used to refer to the **Class Thread Header** node, and may sometimes be used to refer to the set of nodes and edges that make up the entire Concept Graph.

Other canonical word types:

| # | Word Type | wordTypes | Description |
|---|-----------|-----------|-------------|
| 2 | [**Word**](./word.md) | `word` | Any node whose data structure is a json object (as opposed to, for instance, a jpeg) |
| 3 | [**Relationship**](./relationship.md) | `word, relationship` | Any edge in the graph, directed or not, that connects two nodes |
| 4 | [**Graph**](./graph.md) | `word, graph` | Any set of nodes and edges |
| 5 | [**Relationship Type**](./relationship-type.md) | `word, relationshipType` | Any type of graph database relationship |
| 6 | [**Node Type**](./node-type.md) | `nodeType` | any type of node (eg, word) |
| 7 | [**Word Type**](./word-type.md) | `word, wordType` | a type of word (e.g., coffeeHouse) |
| 8 | [**Tapestry**](./tapestry.md) | `word, graph, tapestry` | a graph that validates against the tapestry rules of normalization; the union of many individual concept graphs |

## Conventions

- **`slug`**: kebab-case, human-readable, practically unique (e.g., `primary-property-for-the-coffee-house-concept`)
- **`key`**: camelCase, used as the programmatic identifier / JSON Schema property name (e.g., `coffeeHouse`)
- **`name`**: lowercase human-readable (e.g., `primary property for the coffee house concept`)
- **`title`**: PascalCase / Title Case display name (e.g., `Coffee House`), used for node labels as per the neo4j convention
- **`uuid`**: the a-tag (`kind:pubkey:d-tag`) for replaceable events; derivable from the event itself
- **`RELATIONSHIP_TYPE`**: SCREAMING_SNAKE_CASE, used for relationship types as per the neo4j convention
