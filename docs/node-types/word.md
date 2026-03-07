Word
=====

## Sample JSON (coffee house concept)

```json
{
  "word": {
    "slug": "",
    "name": "",
    "title": "",
    "wordTypes": ["word", ""]
  },
}
```

## JSON Schema node

This is the JSON Schema node for the concept of ``.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-word",
        "title": "JSON Schema for word",
        "name": "JSON Schema for Word",
        "description": "as per the tapestry protocol",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
    },
    "jsonSchema": {
        "name": "",
        "title": "",
        "$schema": "http://json-schema.org/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "word"
        ],
        "properties": {
            "word": {
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
