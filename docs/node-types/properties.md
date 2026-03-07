Properties
=====

## Example of a `Properties` node

- the `Properties` node for the concept of `coffee houses`

It is one of the 8 `core nodes` for the concept of `coffee houses`.

```json
{
  "word": {
    "slug": "the-set-of-properties-for-the-concept-of-coffee-houses",
    "name": "the set of properties for the concept of coffee houses",
    "title": "The Set of Properties for the Concept of Coffee Houses",
    "wordTypes": ["word", "set", "properties"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "set": {
    "slug": "properties-for-the-concept-of-coffee-houses",
    "name": "properties for the concept of coffee houses"
  },
  "properties": {
  }
}
```

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
        "$schema": "http://json-schema.org/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "properties"
        ],
        "properties": {
            "properties": {
                "type": "object",
                "name": "properties",
                "title": "Properties",
                "slug": "properties",
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
