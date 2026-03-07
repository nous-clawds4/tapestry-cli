JSON Data Type
=====

## Example of a `JSON Data Type`

- `object` is an example of a `json data type`; it is the data type of a property that is the parent to one or more child properties

```json
{
  "word": {
    "slug": "json-data-type--object",
    "name": "JSON data type: object",
    "description": "the json schema for the concept of coffee houses",
    "wordTypes": ["word", "jsonDataType"]
  },
  "jsonDataType": {
    "name": "object",
    "title": "Object",
    "description": "Objects are the mapping type in JSON. They map keys to values. In JSON, the keys must always be strings. Each of these pairs is conventionally referred to as a property.",
    "url": "https://json-schema.org/understanding-json-schema/reference/object"
  }
}
```
## JSON Schema node

This is the JSON Schema node for the concept of `json data types`.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-json-data-types",
        "title": "JSON Schema for the concept of JSON Data Types",
        "name": "JSON Schema for the concept of json data types",
        "description": "This is the JSON Schema for elements of the concept of json data types. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
    },
    "jsonSchema": {
        "type": "object",
        "slug": "json-data-type",
        "name": "json data type",
        "title": "JSON Data Type",
        "description": "data about this json data type",
        "$schema": "http://json-schema.org/schema",
        "definitions": {},
        "required": [
            "jsonDataType"
        ],
        "definitions": {},
        "properties": {
            "jsonDataType": {
                "type": "object",
                "name": "json data type",
                "title": "JSON Data Type",
                "slug": "json-data-type",
                "description": "",
                "required": [
                  "name",
                  "description",
                  "url"
                ],
                "unique": [
                  "name"
                ],
                "properties": {
                  "name": {
                    "type": "string",
                    "slug": "name",
                    "name": "name",
                    "title": "name",
                    "description": "the name of this json data type"
                  },
                  "description": {
                    "type": "string",
                    "slug": "description",
                    "name": "description",
                    "title": "Description",
                    "description": "the description of this json data type"
                  },
                  "url": {
                    "type": "string",
                    "slug": "url",
                    "name": "url",
                    "title": "URL",
                    "description": "the url with more information about this json data type"
                  }
                }
            }
        }
    }
}
```
