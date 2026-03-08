Concept Header
=====

The `Concept Header` node is the origin of the [class threads](../glossary/class-thread.md) that define a concept. For the conceptual definition and how it relates to List Headers and concepts, see the [glossary entry](../glossary/concept-header.md).

This document focuses on the structure of the Concept Header's word JSON.

## The naming convention system

The Concept Header is the central location and definitive reference for a concept's naming forms. Scripts and endpoints that need any form of a concept's name look here.

Five naming objects are stored in the `conceptHeader` section, each with `singular` and `plural` variants:

| Object | Purpose | Example (singular) | Example (plural) | Used for |
|---|---|---|---|---|
| `oNames` | lowercase display names | `coffee house` | `coffee houses` | Human-readable text, descriptions |
| `oSlugs` | kebab-case identifiers | `coffee-house` | `coffee-houses` | URLs, d-tags, file names, `slug` tags |
| `oKeys` | camelCase identifiers | `coffeeHouse` | `coffeeHouses` | JSON property keys, primary property wrapper |
| `oTitles` | Title Case display | `Coffee House` | `Coffee Houses` | Headings, titles, UI labels |
| `oLabels` | PascalCase identifiers | `CoffeeHouse` | `CoffeeHouses` | Neo4j labels, class names |

These forms are derived automatically at concept creation time from the singular and plural names provided by the user.

## Example of a `Concept Header`

- the `concept header` for the concept of `coffee houses`

It is one of the 8 [core nodes](../glossary/core-nodes.md) for the concept of `coffee houses`.

```json
{
  "word": {
    "slug": "concept-header-for-the-concept-of-coffee-houses",
    "name": "concept header for the concept of coffee houses",
    "title": "Concept Header for the Concept of Coffee Houses",
    "wordTypes": ["word", "conceptHeader"]
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

Note: the `word` section does **not** include `coreMemberOf`. This is because the Concept Header *is* the core — all other core nodes reference it via `coreMemberOf`, but the header itself has no parent to point to.

## JSON Schema node

This is the JSON Schema node for the `Concept Header` concept.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-concept-headers",
        "title": "JSON Schema for the Concept of Concept Headers",
        "name": "JSON Schema for the concept of concept headers",
        "description": "This is the JSON Schema for elements of the concept of concept headers. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-concept-headers",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "concept header",
        "title": "Concept Header",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": [
            "conceptHeader"
        ],
        "definitions": {},
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
                        "description": "The display names for this concept (lowercase)",
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
                                "description": "Singular display name",
                                "slug": "singular"
                            },
                            "plural": {
                                "type": "string",
                                "name": "plural",
                                "title": "Plural",
                                "description": "Plural display name",
                                "slug": "plural"
                            }
                        }
                    },
                    "oSlugs": {
                        "type": "object",
                        "name": "slug",
                        "title": "Slug",
                        "slug": "slug",
                        "description": "The kebab-case identifiers for this concept",
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
                                "description": "Singular slug (e.g. coffee-house)",
                                "slug": "singular"
                            },
                            "plural": {
                                "type": "string",
                                "name": "plural",
                                "title": "Plural",
                                "description": "Plural slug (e.g. coffee-houses)",
                                "slug": "plural"
                            }
                        }
                    },
                    "oKeys": {
                        "type": "object",
                        "name": "key",
                        "title": "Key",
                        "slug": "key",
                        "description": "The camelCase identifiers for this concept",
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
                                "description": "Singular key (e.g. coffeeHouse)",
                                "slug": "singular"
                            },
                            "plural": {
                                "type": "string",
                                "name": "plural",
                                "title": "Plural",
                                "description": "Plural key (e.g. coffeeHouses)",
                                "slug": "plural"
                            }
                        }
                    },
                    "oTitles": {
                        "type": "object",
                        "name": "title",
                        "title": "Title",
                        "slug": "title",
                        "description": "The Title Case display names for this concept",
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
                                "description": "Singular title (e.g. Coffee House)",
                                "slug": "singular"
                            },
                            "plural": {
                                "type": "string",
                                "name": "plural",
                                "title": "Plural",
                                "description": "Plural title (e.g. Coffee Houses)",
                                "slug": "plural"
                            }
                        }
                    },
                    "oLabels": {
                        "type": "object",
                        "name": "label",
                        "title": "Label",
                        "slug": "label",
                        "description": "The PascalCase identifiers for this concept",
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
                                "description": "Singular label (e.g. CoffeeHouse)",
                                "slug": "singular"
                            },
                            "plural": {
                                "type": "string",
                                "name": "plural",
                                "title": "Plural",
                                "description": "Plural label (e.g. CoffeeHouses)",
                                "slug": "plural"
                            }
                        }
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "description": "A human-readable description of this concept",
                        "slug": "description"
                    }
                }
            }
        }
    }
}
```
