Superset
=====

## Sample JSON (as a core member node for the coffee house concept)

```json
{
  "word": {
    "slug": "the superset-of-all-coffee-houses",
    "name": "the superset of all coffee houses",
    "title": "The Superset of All Coffee Houses",
    "wordTypes": ["word", "superset"],
    "coreMemberOf": [ {"slug": "class-thread-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "superset": {
    "name": "coffee houses",
    "title": "Coffee Houses",
    "slug": "coffee-houses",
    "description": "This is the superset of all known coffee houses."
  }
}
```

## JSON Schema node

This is the JSON Schema node for the Superset concept.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-superset",
        "title": "JSON Schema for Superset",
        "name": "JSON Schema for superset",
        "description": "",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
    },
    "jsonSchema": {
        "name": "superset",
        "title": "Superset",
        "$schema": "http://json-schema.org/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "superset"
        ],
        "properties": {
            "superset": {
                "type": "object",
                "name": "superset",
                "title": "Superset",
                "slug": "superset",
                "alias": "superset",
                "description": "data about this superset",
                "required": [

                ],
                "unique": [

                ],
                "properties": {
                    "name": {
                        "type": "string",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
                        "description": "The name for this superset"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "description": "The top-level description for this superset",
                        "slug": "description"
                    }
                }
            }
        }
    }
}
```
