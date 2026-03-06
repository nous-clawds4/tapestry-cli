Class Thread Header
=====

## Sample JSON (coffee house concept)

```json
{
  "word": {
    "slug": "class-thread-header-for-the-concept-of-coffee-houses",
    "name": "class thread header for the concept of coffee houses",
    "title": "Class Thread Header for the Concept of Coffee Houses",
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
    "oKeys": {
      "singular": "coffeeHouse",
      "plural": "coffeeHouses"
    },
    "oTitles": {
      "singular": "Coffee House",
      "plural": "Coffee Houses"
    },
    "oLabels": {
      "singular": "CoffeeHouse",
      "plural": "CoffeeHouses"
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
                "slug": "class-thread-header",
                "description": "data about this class thread header",
                "required": [
                    "oNames",
                    "oSlugs",
                    "oKeyes",
                    "oTitles",
                    "oLabels"
                ],
                "unique": [
                    "oNames",
                    "oSlugs",
                    "oKeyes",
                    "oTitles",
                    "oLabels"
                ],
                "properties": {
                    "oNames": {
                        "type": "object",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
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
                        }
                    },
                    "oSlugs": {
                        "type": "object",
                        "name": "slug",
                        "title": "Slug",
                        "slug": "slug",
                        "description": "The top-level slug for this concept",
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
                        }
                    },
                    "oKeyes": {
                        "type": "object",
                        "name": "key",
                        "title": "Key",
                        "slug": "key",
                        "description": "The top-level key for this concept",
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
                        }
                    },
                    "oTitles": {
                        "type": "object",
                        "name": "title",
                        "title": "Title",
                        "slug": "title",
                        "description": "The top-level title for this concept",
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
                        }
                    },
                    "olabels": {
                        "type": "object",
                        "name": "label",
                        "title": "Label",
                        "slug": "label",
                        "description": "The top-level label for this concept",
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
                        }
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "description": "The top-level description for this concept",
                        "slug": "description"
                    }
                }
            }
        }
    }
}
```
