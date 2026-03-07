Concept Header
=====

## Sample JSON (as a core member node for the coffee house concept)

```json
{
  "word": {
    "slug": "concept-header-for-the-concept-of-coffee-houses",
    "name": "concept header for the concept of coffee houses",
    "title": "Concept Header for the Concept of Coffee Houses",
    "wordTypes": ["word", "conceptHeader"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "conceptHeader": {
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

This is the JSON Schema node for the Concept Header concept.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-concept-headers",
        "title": "JSON Schema for the concept of Concept Headers",
        "name": "JSON Schema for the concept of concept headers",
        "description": "This is the JSON Schema for elements of the concept of concept headers. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
    },
    "jsonSchema": {
        "name": "concept header",
        "title": "Concept Header",
        "$schema": "http://json-schema.org/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "conceptHeader"
        ],
        "properties": {
            "conceptHeader": {
                "type": "object",
                "name": "concept header",
                "title": "Concept Header",
                "slug": "concept-header",
                "alias": "class thread header",
                "description": "data about this concept header",
                "required": [
                    "oNames",
                    "oSlugs",
                    "oKeys",
                    "oTitles",
                    "oLabels"
                ],
                "unique": [
                    "oNames",
                    "oSlugs",
                    "oKeys",
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
                    "oKeys": {
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
                    "oLabels": {
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
