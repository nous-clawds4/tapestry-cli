Property Tree Graph
=====

The `Property Tree Graph` node records the structure of a concept's property tree — the [JSON Schema](./json-schema.md) node, the [Primary Property](./primary-property.md), the [Properties set](./properties.md), and all downstream [Property](./property.md) nodes, along with the `IS_A_PROPERTY_OF` relationships that connect them.

It is one of the 8 [core nodes](../glossary/core-nodes.md). For the conceptual definition, see the [glossary entry](../glossary/property-tree-graph.md).

Like all graph nodes, it has three top-level sections: `word`, `graph`, and a type-specific section (`propertyTreeGraph`). The `graph` section follows the standard [graph](./graph.md) format with `nodes`, `relationshipTypes`, `relationships`, and `imports`.

## Initial state

At creation time, the Property Tree Graph is pre-populated with the three property-related core nodes and the initial `IS_A_PROPERTY_OF` wiring from the primary property to the JSON Schema node:

```json
{
  "word": {
    "slug": "property-tree-graph-for-the-concept-of-coffee-houses",
    "name": "property tree graph for the concept of coffee houses",
    "title": "Property Tree Graph for the Concept of Coffee Houses",
    "wordTypes": ["word", "graph", "propertyTreeGraph"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "graph": {
    "nodes": [
      { "slug": "json-schema-for-the-concept-of-coffee-houses", "uuid": "<schema-uuid>" },
      { "slug": "primary-property-for-the-concept-of-coffee-houses", "uuid": "<pp-uuid>" },
      { "slug": "the-set-of-properties-for-the-concept-of-coffee-houses", "uuid": "<props-uuid>" }
    ],
    "relationshipTypes": [
      { "slug": "IS_A_PROPERTY_OF" }
    ],
    "relationships": [
      {
        "nodeFrom": { "slug": "primary-property-for-the-concept-of-coffee-houses" },
        "relationshipType": { "slug": "IS_A_PROPERTY_OF" },
        "nodeTo": { "slug": "json-schema-for-the-concept-of-coffee-houses" }
      }
    ],
    "imports": []
  },
  "propertyTreeGraph": {
    "description": "the collection of the JSON schema node, all property nodes and all of their connections for the concept of coffee houses"
  }
}
```

As additional properties are created and wired (via `tapestry property create` or `tapestry property generate-tree`), the `graph.nodes` and `graph.relationships` arrays grow to reflect the full tree.

## JSON Schema node

This is the JSON Schema node for the concept of `property tree graphs`.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-property-tree-graphs",
        "title": "JSON Schema for the Concept of Property Tree Graphs",
        "name": "JSON Schema for the concept of property tree graphs",
        "description": "This is the JSON Schema for elements of the concept of property tree graphs. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-property-tree-graphs",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "property tree graph",
        "title": "Property Tree Graph",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "propertyTreeGraph"
        ],
        "properties": {
            "propertyTreeGraph": {
                "type": "object",
                "name": "property tree graph",
                "title": "Property Tree Graph",
                "slug": "property-tree-graph",
                "description": "data about this property tree graph",
                "required": [
                    "description"
                ],
                "unique": [],
                "properties": {
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "slug": "description",
                        "description": "A description of this property tree graph"
                    }
                }
            }
        }
    }
}
```
