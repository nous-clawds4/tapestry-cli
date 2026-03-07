Word
=====

## Example of a `Word`

- `object` is an example of a `json data type`; it is the data type of a property that is the parent to one or more child properties

```json
{
  "word": {
    "slug": "json-data-type--object",
    "name": "JSON data type: object",
    "title": "JSON Data Type: Object",
    "description": "the json data type: object",
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
        "title": "Word",
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
                    "slug",
                    "wordTypes"
                ],
                "unique": [
                    "slug"
                ],
                "properties": {
                  "slug": {
                    "type": "string",
                    "name": "slug",
                    "slug": "slug",
                    "title": "Slug",
                    "comments": "The tapestry protocol requires that the slug of a word must be unique within any given concept graph. By convention, this may be accomplished via concatenation of the slug of the principal parent concept (which must be unique within any given concept graph) and the parentConcept.slug of the word, e.g. coffeeHouse.slug, which must be unique within that concept."
                  },
                  "wordTypes": {
                    "type": "array"
                  }
                }
            }
        }
    }
}
```
