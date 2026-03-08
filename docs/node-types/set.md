Set
=====

A `Set` is a named subset of elements within a concept. Sets provide the [class thread propagation](../glossary/class-thread-propagation.md) layer between the [Superset](../glossary/superset.md) and [Elements](../glossary/element.md). For the conceptual definition, see the [glossary entry](../glossary/set.md).

Sets are optional — a concept can have elements directly on the superset without any intermediate sets. When present, sets enable hierarchical organization (e.g., "London coffee houses" as a subset of all coffee houses).

Note: a Set is **not** one of the 8 [core nodes](../glossary/core-nodes.md). Core nodes are created automatically with the concept; sets are added later as needed.

## Example of a `Set`

- `London coffee houses` is an example of a `set`

```json
{
  "word": {
    "slug": "a-set-of-coffee-houses",
    "name": "a set of coffee houses",
    "title": "A Set of Coffee Houses",
    "wordTypes": ["word", "set"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-sets", "uuid": "<uuid>"} ]
  },
  "set": {
    "slug": "london-coffee-houses",
    "name": "London coffee houses"
  }
}
```

## JSON Schema node

This is the JSON Schema node for the Set concept.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-sets",
        "title": "JSON Schema for the Concept of Sets",
        "name": "JSON Schema for the concept of sets",
        "description": "This is the JSON Schema for elements of the concept of sets. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-sets",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "set",
        "title": "Set",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "set"
        ],
        "properties": {
            "set": {
                "type": "object",
                "name": "set",
                "title": "Set",
                "slug": "set",
                "alias": "set",
                "description": "data about this set",
                "required": [
                    "slug"
                ],
                "unique": [
                    "slug"
                ],
                "properties": {
                    "slug": {
                        "type": "string",
                        "name": "slug",
                        "title": "Slug",
                        "slug": "slug",
                        "description": "The slug for this set"
                    },
                    "name": {
                        "type": "string",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
                        "description": "The name for this set"
                    },
                    "title": {
                        "type": "string",
                        "name": "title",
                        "title": "Title",
                        "slug": "title",
                        "description": "The title for this set"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "description": "The top-level description for this set",
                        "slug": "description"
                    }
                }
            }
        }
    }
}
```
