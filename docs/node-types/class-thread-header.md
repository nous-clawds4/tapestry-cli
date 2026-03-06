Class Thread Header
=====

## Sample JSON (coffee house concept)

```json
{
  "word": {
    "slug": "class-thread-header-for-the-concept-of-coffee-houses",
    "name": "class thread header for the concept of coffee houses",
    "wordTypes": ["word", "classThreadHeader"]
  },
  "classThreadHeader": {
    "description": "A coffee house is a place to get coffee!",
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
    }
  }
}
```

## JSON Schema node

This is the JSON Schema node for the Class Thread Header concept.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

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
    "jsonSchema": {
        "name": "class thread header",
        "title": "Class Thread Header",
        "$schema": "http://json-schema.org/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "classThreadHeader"
        ],
        "properties": {
            "classThreadHeader": {
                "type": "object",
                "name": "class thread header",
                "title": "Class Thread Header",
                "description": "data about this class thread header",
                "types": [
                    "primaryProperty"
                ],
                "require": true,
                "required": [
                    "oName",
                    "oTitle",
                    "oSlug"
                ],
                "unique": [
                    "oName",
                    "oTitle",
                    "oSlug"
                ],
                "properties": {
                    "oSlug": {
                        "type": "string",
                        "name": "slug",
                        "title": "Slug",
                        "description": "The top-level slug for this concept",
                        "slug": "slug"
                    },
                    "oName": {
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
                    "oTitle": {
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
                "slug": "classThreadHeader"
            }
        }
    }
}
```
