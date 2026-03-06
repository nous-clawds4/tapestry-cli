Set
=====

## Sample JSON (coffee house concept)

```json
{
  "word": {
    "slug": "a-set-of-coffee-houses",
    "name": "a set of coffee houses",
    "title": "A Set of Coffee Houses",
    "wordTypes": ["word", "set"]
  },
  "set": {
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
        "slug": "json-schema-for-set",
        "title": "JSON Schema for Set",
        "name": "JSON Schema for set",
        "description": "",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
    },
    "jsonSchema": {
        "name": "concept header",
        "title": "Concept Header",
        "$schema": "http://json-schema.org/schema",
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

                ],
                "unique": [

                ],
                "properties": {
                    "name": {
                        "type": "string",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
                        "description": "The name for this set"
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
