Foo Bar
=====

## Sample JSON

```json
{
  "word": {
    "slug": "",
    "name": "",
    "title": "",
    "wordTypes": ["word", ""]
  },
  "": {
  }
}
```

## JSON Schema node

This is the JSON Schema node for the concept of ``.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-foo-bar",
        "title": "JSON Schema for the concept of Foo Bars",
        "name": "JSON Schema for the concept of foo bars",
        "description": "This is the JSON Schema for elements of the concept of foo bars. Every element of this concept must validate against this JSON schema.",
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
