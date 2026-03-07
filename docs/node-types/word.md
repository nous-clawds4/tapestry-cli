Word
=====

## Example of a `Word`

- `object` is an example of a `json data type`; it is the data type of a property that is the parent to one or more child properties

```json
{
  "word": {
    "slug": "json-data-type--object",
    "name": "JSON data type: object",
    "description": "the json schema for the concept of coffee houses",
    "wordTypes": ["word", "jsonDataType"]
  }
}
```

## JSON Schema node

This is the JSON Schema node for the concept of `word`.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-word",
        "title": "JSON Schema for word",
        "name": "JSON Schema for Word",
        "description": "",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
    },
    "jsonSchema": {
        "name": "word",
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
