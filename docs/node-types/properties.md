Properties
=====

The `Properties` node is the set of all [properties](../glossary/property.md) for a concept. It is one of the 8 [core nodes](../glossary/core-nodes.md).

Like the [Superset](./superset.md), the Properties node is itself a [Set](../glossary/set.md) — its elements are the individual property nodes that define the concept's schema structure. Each property in the concept's [property tree](./property-tree-graph.md) is a member of this set.

The Properties node is connected to the Concept Header via `IS_THE_PROPERTIES_SET_FOR`.

## Example of a `Properties` node

- the `Properties` node for the concept of `coffee houses`

It is one of the 8 `core nodes` for the concept of `coffee houses`.

```json
{
  "word": {
    "slug": "the-set-of-properties-for-the-concept-of-coffee-houses",
    "name": "the set of properties for the concept of coffee houses",
    "title": "The Set of Properties for the Concept of Coffee Houses",
    "wordTypes": ["word", "set", "properties"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "set": {
    "slug": "properties-for-the-concept-of-coffee-houses",
    "name": "properties for the concept of coffee houses"
  },
  "properties": {
    "description": "This is the set of all properties that make up the property tree graph for the concept of coffee houses."
  }
}
```

Note: the `set` section follows the same pattern as any other set node (validated by the [JSON Schema for the concept of sets](./set.md)).

## JSON Schema node

This is the JSON Schema node for the concept of `properties nodes`.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-properties-nodes",
        "title": "JSON Schema for the Concept of Properties Nodes",
        "name": "JSON Schema for the concept of properties nodes",
        "description": "This is the JSON Schema for elements of the concept of properties nodes. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-properties-nodes",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "properties node",
        "title": "Properties Node",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "properties"
        ],
        "properties": {
            "properties": {
                "type": "object",
                "name": "properties",
                "title": "Properties",
                "slug": "properties",
                "description": "data about this properties node",
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
                        "description": "A description of this properties node"
                    }
                }
            }
        }
    }
}
```
