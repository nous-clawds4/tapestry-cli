Properties Set
=====

The `Properties Set` node is the set of all [properties](../glossary/property.md) for a concept. It is one of the 8 [core nodes](../glossary/core-nodes.md).

Like the [Superset](./superset.md), the Properties Set node is itself a [Set](../glossary/set.md) — its elements are the individual property nodes that define the concept's schema structure. Each property in the concept's [property tree](./property-tree-graph.md) is a member of this set.

The Properties Set node is connected to the Concept Header via `IS_THE_PROPERTIES_SET_FOR`.

> **Note on naming:** This core concept was previously called "properties node" / "properties nodes." It was renamed to "properties set" / "properties sets" to avoid confusion with the non-core "property" / "properties" concept (which describes individual property items).

## Example of a `Properties Set` node

- the `Properties Set` node for the concept of `coffee houses`

It is one of the 8 `core nodes` for the concept of `coffee houses`.

```json
{
  "word": {
    "slug": "the-set-of-properties-for-the-concept-of-coffee-houses",
    "name": "the set of properties for the concept of coffee houses",
    "title": "The Set of Properties for the Concept of Coffee Houses",
    "wordTypes": ["word", "set", "propertiesSet"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "set": {
    "slug": "properties-for-the-concept-of-coffee-houses",
    "name": "properties for the concept of coffee houses"
  },
  "propertiesSet": {
    "description": "This is the set of all properties that make up the property tree graph for the concept of coffee houses."
  }
}
```

Note: the `set` section follows the same pattern as any other set node (validated by the [JSON Schema for the concept of sets](./set.md)).

## JSON Schema node

This is the JSON Schema node for the concept of `properties sets`.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-properties-sets",
        "title": "JSON Schema for the Concept of Properties Sets",
        "name": "JSON Schema for the concept of properties sets",
        "description": "This is the JSON Schema for elements of the concept of properties sets. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-properties-sets",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "properties set",
        "title": "Properties Set",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "propertiesSet"
        ],
        "properties": {
            "propertiesSet": {
                "type": "object",
                "name": "properties set",
                "title": "Properties Set",
                "slug": "properties-set",
                "description": "data about this properties set",
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
                        "description": "A description of this properties set"
                    }
                }
            }
        }
    }
}
```
