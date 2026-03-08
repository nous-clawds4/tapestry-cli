Word
=====

A `word` is any node in the concept graph whose content is structured JSON data. For the conceptual definition, see the [glossary entry](../glossary/word.md). For how `word` relates to other [node types](../glossary/node-type.md) (like [image](../glossary/image.md)), see the [node type spec](./node-type.md).

Every word has a `word` section in its JSON containing universal metadata. This section is the one thing all words share, regardless of their specific type. Additional type-specific sections (e.g., `coffeeHouse`, `superset`, `jsonSchema`) are added based on the node's `wordTypes`.

## The `word` section

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | ✅ | Unique kebab-case identifier within the concept graph. By convention, formed by concatenating the concept slug with the element's own slug (e.g., `coffee-house--metropolis-coffee-company`). |
| `name` | string | | Lowercase human-readable name |
| `title` | string | | Title Case display name |
| `description` | string | | Human-readable description |
| `wordTypes` | array | ✅ | Ordered list of word types, coarse to fine (e.g., `["word", "set", "superset"]`). Always starts with `"word"`. |
| `coreMemberOf` | array | | Back-pointer(s) to the Concept Header this node is a [core node](../glossary/core-nodes.md) of. Each entry has `slug` and `uuid`. Present on core nodes; absent on regular elements. |

## Example: a coffee house element

A simple element — the most common kind of word. It has only a `word` section and a type-specific section (`coffeeHouse`).

```json
{
  "word": {
    "slug": "coffee-house--metropolis-coffee-company",
    "name": "coffee house: Metropolis Coffee Company",
    "title": "Coffee House: Metropolis Coffee Company",
    "description": "A beloved Chicago roaster and café known for single-origin pour-overs.",
    "wordTypes": ["word", "coffeeHouse"]
  },
  "coffeeHouse": {
    "slug": "metropolis-coffee-company",
    "name": "Metropolis Coffee Company",
    "description": "A beloved Chicago roaster and café known for single-origin pour-overs and a cozy Andersonville atmosphere.",
    "address": {
      "street": "1039 W Granville Ave",
      "city": "Chicago",
      "state": "Illinois",
      "zip": "60660"
    }
  }
}
```

Note: regular elements do not have `coreMemberOf` — only [core nodes](../glossary/core-nodes.md) do.

## Example: a superset (multi-type word)

A Superset is both a set and a superset. Its `wordTypes` array reflects this hierarchy from coarse to fine:

```json
{
  "word": {
    "slug": "superset-for-the-concept-of-coffee-houses",
    "name": "the superset of all coffee houses",
    "title": "The Superset of All Coffee Houses",
    "wordTypes": ["word", "set", "superset"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      }
    ]
  },
  "set": {
    "slug": "coffee-houses",
    "name": "coffee houses"
  },
  "superset": {
    "description": "the set of all coffee houses"
  }
}
```

Note: this word has three top-level sections (`word`, `set`, `superset`) corresponding to its three word types. Each word type may add its own required section to the JSON.

## `wordTypes` ordering convention

Word types are listed coarse to fine. The first entry is always `"word"`. Subsequent entries reflect the type hierarchy:

- `["word", "coffeeHouse"]` — a simple element
- `["word", "set", "superset"]` — a superset (which is also a set)
- `["word", "graph", "coreNodesGraph"]` — a core nodes graph (which is also a graph)
- `["word", "jsonSchema", "validationTool"]` — a JSON Schema (which is also a validation tool)
- `["word", "property", "primaryProperty"]` — a primary property (which is also a property)

## JSON Schema node

This is the JSON Schema node for the concept of `words`. This schema validates only the universal `word` section — type-specific sections are validated by their own concept schemas.

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-words",
        "title": "JSON Schema for the Concept of Words",
        "name": "JSON Schema for the concept of words",
        "description": "This is the JSON Schema for elements of the concept of words. Every word node must validate against this JSON schema. Type-specific sections (coffeeHouse, superset, jsonSchema, etc.) are validated by their own concept schemas.",
        "wordTypes": [
            "word",
            "jsonSchema",
            "validationTool"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-words",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "word",
        "title": "Word",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "word"
        ],
        "properties": {
            "word": {
                "type": "object",
                "name": "word",
                "title": "Word",
                "slug": "word",
                "description": "Universal metadata present on every word node",
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
                        "title": "Slug",
                        "slug": "slug",
                        "description": "Unique kebab-case identifier within the concept graph. By convention, formed by concatenating the concept slug and the element slug (e.g., coffee-house--metropolis-coffee-company)."
                    },
                    "name": {
                        "type": "string",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
                        "description": "Lowercase human-readable name"
                    },
                    "title": {
                        "type": "string",
                        "name": "title",
                        "title": "Title",
                        "slug": "title",
                        "description": "Title Case display name"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "slug": "description",
                        "description": "Human-readable description of this word"
                    },
                    "wordTypes": {
                        "type": "array",
                        "name": "word types",
                        "title": "Word Types",
                        "slug": "word-types",
                        "description": "Ordered list of word types from coarse to fine. Always starts with 'word'.",
                        "items": {
                            "type": "string"
                        },
                        "minItems": 1
                    },
                    "coreMemberOf": {
                        "type": "array",
                        "name": "core member of",
                        "title": "Core Member Of",
                        "slug": "core-member-of",
                        "description": "Back-pointer(s) to the Concept Header this node is a core node of. Present on core nodes; absent on regular elements.",
                        "items": {
                            "type": "object",
                            "required": ["slug"],
                            "properties": {
                                "slug": { "type": "string" },
                                "uuid": { "type": "string" }
                            }
                        }
                    }
                }
            }
        }
    }
}
```
