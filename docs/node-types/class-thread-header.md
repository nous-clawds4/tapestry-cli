Class Thread Header
=====

## Sample JSON (coffee house concept)

```json
{
  "word": {
    "slug": "class-thread-header-for-the-coffee-house-concept",
    "name": "class thread header for the coffee house concept",
    "description": "the class thread header for the coffee house concept",
    "wordTypes": ["word", "classThreadHeader"]
  },
  "classThreadHeader": {
    "oNames": {
      "singular": "coffee house",
      "plural": "coffee houses"
    },
    "oSlugs": {
      "singular": "coffee-house",
      "plural": "coffee-houses"
    },
    "oTitles": {
      "singular": "Coffee House",
      "plural": "Coffee Houses"
    },
    "label": "CoffeeHouse"
  }
}
```

## JSON Schema node

```json
{
    "word": {
        "slug": "json-schema-for-class-thread-header",
        "title": "JSON Schema for Class Thread Header",
        "name": "JSON Schema for class thread header",
        "description": "",
        "principalWordType": "jsonSchema",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
    },
    "jsonSchemaData": {
        "name": "concept",
        "title": "Concept",
        "$schema": "http://json-schema.org/draft-07/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "conceptData"
        ],
        "properties": {
            "conceptData": {
                "type": "object",
                "name": "concept data",
                "title": "concept Data",
                "description": "data about this concept",
                "types": [
                    "primaryProperty"
                ],
                "require": true,
                "required": [
                    "name",
                    "title",
                    "slug"
                ],
                "unique": [
                    "name",
                    "title",
                    "slug"
                ],
                "properties": {
                    "slug": {
                        "type": "string",
                        "name": "slug",
                        "title": "Slug",
                        "description": "The top-level slug for this concept",
                        "slug": "slug"
                    },
                    "name": {
                        "type": "object",
                        "name": "name",
                        "title": "Name",
                        "description": "The top-level name for this concept",
                        "required": [
                            "singular",
                            "plural"
                        ],
                        "unique": [],
                        "properties": {
                            "singular": {
                                "type": "string",
                                "name": "singular",
                                "title": "Singular",
                                "description": "",
                                "slug": "singular"
                            },
                            "plural": {
                                "type": "string",
                                "name": "plural",
                                "title": "Plural",
                                "description": "",
                                "slug": "plural"
                            }
                        },
                        "slug": "name"
                    },
                    "title": {
                        "type": "string",
                        "name": "title",
                        "title": "Title",
                        "description": "The top-level title for this concept",
                        "slug": "title"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "description": "The top-level description for this concept",
                        "slug": "description"
                    }
                },
                "slug": "conceptData"
            }
        },
    },
}
```
