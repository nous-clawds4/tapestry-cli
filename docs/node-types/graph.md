Graph
=====

A `Graph` is a node type whose word JSON contains a `graph` section that records a structured collection of nodes, relationship types, relationships, and imports. It is the abstract parent type for the three graph subtypes that appear as [core nodes](../glossary/core-nodes.md) in every concept skeleton:

1. **[Core Nodes Graph](./core-nodes-graph.md)** — records the 8 core nodes and the relationships that wire them to the Concept Header
2. **[Concept Graph](./concept-graph.md)** — records the class thread structure: Concept Header → Superset → Sets → Elements
3. **[Property Tree Graph](./property-tree-graph.md)** — records the JSON Schema node, Primary Property, Properties set, and all downstream property nodes with their `IS_A_PROPERTY_OF` wiring

Every graph node has at least two top-level sections in its word JSON: `word` and `graph`. Subtypes add a third section named after their specific type (e.g., `coreNodesGraph`, `conceptGraph`, `propertyTreeGraph`).

## The `graph` section

The `graph` section is the common structure shared by all graph subtypes:

| Field | Type | Description |
|---|---|---|
| `nodes` | array | The nodes contained in this graph. Each entry has a `slug` and `uuid`. |
| `relationshipTypes` | array | The types of relationships used in this graph. Each entry has a `slug` (and optionally a `uuid`). |
| `relationships` | array | The directed edges. Each has `nodeFrom`, `relationshipType`, and `nodeTo` (referenced by slug). |
| `imports` | array | Other graphs whose contents are logically included. Each has a `slug`, `name`, and `uuid`. |

The `imports` mechanism allows graphs to compose: for example, the Concept Graph imports the Property Tree Graph and Core Nodes Graph rather than duplicating their contents.

## Example of a `Graph`

The following is a generic graph node. In practice, you will encounter one of the three subtypes listed above rather than a bare `graph`. This example shows the common structure using the core nodes graph for the concept of `coffee houses`:

```json
{
  "word": {
    "slug": "core-nodes-graph-for-the-concept-of-coffee-houses",
    "name": "core nodes graph for the concept of coffee houses",
    "title": "Core Nodes Graph for the Concept of Coffee Houses",
    "wordTypes": ["word", "graph", "coreNodesGraph"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      }
    ]
  },
  "graph": {
    "nodes": [
      { "slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>" },
      { "slug": "superset-for-the-concept-of-coffee-houses", "uuid": "<uuid>" },
      { "slug": "json-schema-for-the-concept-of-coffee-houses", "uuid": "<uuid>" },
      { "slug": "primary-property-for-the-concept-of-coffee-houses", "uuid": "<uuid>" },
      { "slug": "the-set-of-properties-for-the-concept-of-coffee-houses", "uuid": "<uuid>" },
      { "slug": "property-tree-graph-for-the-concept-of-coffee-houses", "uuid": "<uuid>" },
      { "slug": "core-nodes-graph-for-the-concept-of-coffee-houses", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-coffee-houses", "uuid": "<uuid>" }
    ],
    "relationshipTypes": [
      { "slug": "IS_THE_CONCEPT_FOR" },
      { "slug": "IS_THE_JSON_SCHEMA_FOR" },
      { "slug": "IS_THE_PRIMARY_PROPERTY_FOR" },
      { "slug": "IS_THE_PROPERTIES_SET_FOR" },
      { "slug": "IS_THE_PROPERTY_TREE_GRAPH_FOR" },
      { "slug": "IS_THE_CORE_GRAPH_FOR" },
      { "slug": "IS_THE_CONCEPT_GRAPH_FOR" }
    ],
    "relationships": [
      {
        "nodeFrom": { "slug": "concept-header-for-the-concept-of-coffee-houses" },
        "relationshipType": { "slug": "IS_THE_CONCEPT_FOR" },
        "nodeTo": { "slug": "superset-for-the-concept-of-coffee-houses" }
      },
      {
        "nodeFrom": { "slug": "json-schema-for-the-concept-of-coffee-houses" },
        "relationshipType": { "slug": "IS_THE_JSON_SCHEMA_FOR" },
        "nodeTo": { "slug": "concept-header-for-the-concept-of-coffee-houses" }
      }
    ],
    "imports": []
  },
  "coreNodesGraph": {
    "description": "the set of core nodes for the concept of coffee houses"
  }
}
```

Note: the `relationships` array above is abbreviated for readability. The full core nodes graph includes all 7 relationships wiring each core node to the Concept Header. See [core-nodes-graph.md](./core-nodes-graph.md) for the complete example.

## `wordTypes` convention

Graph nodes always include `"word"` and `"graph"` in their `wordTypes` array, plus the specific subtype slug:

- Core Nodes Graph: `["word", "graph", "coreNodesGraph"]`
- Concept Graph: `["word", "graph", "conceptGraph"]`
- Property Tree Graph: `["word", "graph", "propertyTreeGraph"]`

## JSON Schema node

This is the JSON Schema node for the concept of `graphs`.

The example above should validate against the JSON schema within the file below (within `jsonSchema`). Note that this schema covers only the common `graph` section — each subtype adds its own required section validated by its own concept's JSON Schema.

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-graphs",
        "title": "JSON Schema for the Concept of Graphs",
        "name": "JSON Schema for the concept of graphs",
        "description": "This is the JSON Schema for elements of the concept of graphs. Every graph node must validate against this JSON schema. Subtype-specific sections (coreNodesGraph, conceptGraph, propertyTreeGraph) are validated by their own concept schemas.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-graphs",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "graph",
        "title": "Graph",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "graph"
        ],
        "properties": {
            "graph": {
                "type": "object",
                "name": "graph",
                "title": "Graph",
                "slug": "graph",
                "description": "A structured collection of nodes, relationship types, relationships, and imports",
                "required": [
                    "nodes",
                    "relationshipTypes",
                    "relationships"
                ],
                "unique": [],
                "properties": {
                    "nodes": {
                        "type": "array",
                        "name": "nodes",
                        "title": "Nodes",
                        "slug": "nodes",
                        "description": "The nodes contained in this graph",
                        "items": {
                            "type": "object",
                            "required": ["slug"],
                            "properties": {
                                "slug": { "type": "string" },
                                "uuid": { "type": "string" },
                                "name": { "type": "string" }
                            }
                        }
                    },
                    "relationshipTypes": {
                        "type": "array",
                        "name": "relationship types",
                        "title": "Relationship Types",
                        "slug": "relationship-types",
                        "description": "The types of relationships used in this graph",
                        "items": {
                            "type": "object",
                            "required": ["slug"],
                            "properties": {
                                "slug": { "type": "string" },
                                "uuid": { "type": "string" }
                            }
                        }
                    },
                    "relationships": {
                        "type": "array",
                        "name": "relationships",
                        "title": "Relationships",
                        "slug": "relationships",
                        "description": "The directed edges connecting nodes in this graph",
                        "items": {
                            "type": "object",
                            "required": ["nodeFrom", "relationshipType", "nodeTo"],
                            "properties": {
                                "nodeFrom": {
                                    "type": "object",
                                    "properties": { "slug": { "type": "string" } }
                                },
                                "relationshipType": {
                                    "type": "object",
                                    "properties": { "slug": { "type": "string" } }
                                },
                                "nodeTo": {
                                    "type": "object",
                                    "properties": { "slug": { "type": "string" } }
                                }
                            }
                        }
                    },
                    "imports": {
                        "type": "array",
                        "name": "imports",
                        "title": "Imports",
                        "slug": "imports",
                        "description": "Other graphs whose contents are logically included in this graph",
                        "items": {
                            "type": "object",
                            "properties": {
                                "slug": { "type": "string" },
                                "name": { "type": "string" },
                                "uuid": { "type": "string" }
                            }
                        }
                    }
                }
            }
        }
    }
}
```
