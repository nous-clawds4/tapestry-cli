Tapestry
=====

A tapestry is a `graph` that validates against the *normalization rules* of the tapestry protocol.

## Examples of a `Tapestry`

### The tapestry for the Grapevine

```json
{
  "word": {
    "slug": "tapestry--grapevine",
    "name": "",
    "title": "",
    "wordTypes": ["word", "graph", "tapestry"]
  },
  "graph": {
    "nodes": [
        {
            "slug": "concept-graph-for-the-concept-of-ratings",
            "uuid": "<uuid>"
        }
    ],
    "relationshipTypes": [],
    "relationships": [],
    "imports": [
        {
            "slug": "tapestry--bios",
            "uuid": "<uuid>"
        }
    ]
  },
  "tapestry": {
    "slug": "grapevine",
    "title": "Grapevine",
    "desciption": "this is the collection of all concepts that are integral to using the Grapevine"
  }
}
```

### The Tapestry for the BIOS underlying the tapestry protocol

## JSON Schema node

This is the JSON Schema node for the concept of ``.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-",
        "title": "JSON Schema for",
        "name": "JSON Schema for",
        "description": "",
        "wordTypes": [
            "word",
            "jsonSchema"
        ]
    },
    "jsonSchema": {
        "name": "",
        "title": "",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            ""
        ],
        "properties": {
            "": {
                "type": "object",
                "name": "",
                "title": "",
                "slug": "",
                "alias": "",
                "description": "",
                "required": [

                ],
                "unique": [

                ],
                "properties": {
                }
            }
        }
    }
}
```
