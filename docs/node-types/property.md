Property
=====

## Sample JSON

```json
{
  "word": {
    "slug": "",
    "name": "",
    "title": "",
    "wordTypes": ["word", "property"]
  },
  "property": {
  }
}
```

## JSON Schema node

This is the JSON Schema node for the concept of `property`.

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
        "$schema": "http://json-schema.org/schema",
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
