Tapestry
=====

A `tapestry` is a [graph](./graph.md) that validates against the [normalization rules](../NORMALIZATION.md) of the tapestry protocol. It represents the union of many individual [concept graphs](./concept-graph.md) into a single coherent structure. For the conceptual definition, see the [glossary entry](../glossary/tapestry.md).

A tapestry's `graph.nodes` array lists the concept graphs it contains directly, while `graph.imports` references other tapestries whose concepts are included by reference. This allows tapestries to compose: an application-specific tapestry (like Grapevine) can import the BIOS tapestry rather than redeclaring all the foundational concepts.

Word types: `["word", "graph", "tapestry"]`

## Example: the BIOS tapestry

The foundational tapestry underlying the tapestry protocol itself. It contains the meta-concepts that every other tapestry depends on: node types, supersets, sets, relationships, relationship types, properties, JSON schemas, lists, JSON data types, graph types, and graphs.

```json
{
  "word": {
    "slug": "tapestry--bios",
    "name": "tapestry: BIOS",
    "title": "Tapestry: BIOS",
    "description": "The foundational tapestry containing the meta-concepts that underlie the tapestry protocol itself.",
    "wordTypes": ["word", "graph", "tapestry"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-tapestries",
        "uuid": "<uuid>"
      }
    ]
  },
  "graph": {
    "nodes": [
      { "slug": "concept-graph-for-the-concept-of-node-types", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-supersets", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-sets", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-relationships", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-relationship-types", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-properties", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-json-schemas", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-lists", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-json-data-types", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-graph-types", "uuid": "<uuid>" },
      { "slug": "concept-graph-for-the-concept-of-graphs", "uuid": "<uuid>" }
    ],
    "relationshipTypes": [],
    "relationships": [],
    "imports": []
  },
  "tapestry": {
    "slug": "bios",
    "title": "BIOS",
    "description": "The foundational tapestry containing the meta-concepts that underlie the tapestry protocol: node types, supersets, sets, relationships, relationship types, properties, JSON schemas, lists, JSON data types, graph types, and graphs."
  }
}
```

## Example: the Grapevine tapestry

An application-specific tapestry for the Grapevine trust engine. It imports the BIOS tapestry (inheriting all foundational meta-concepts) and adds its own domain-specific concepts like ratings.

```json
{
  "word": {
    "slug": "tapestry--grapevine",
    "name": "tapestry: Grapevine",
    "title": "Tapestry: Grapevine",
    "description": "The tapestry for the Grapevine trust engine, containing all concepts integral to computing contextual trust scores.",
    "wordTypes": ["word", "graph", "tapestry"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-tapestries",
        "uuid": "<uuid>"
      }
    ]
  },
  "graph": {
    "nodes": [
      { "slug": "concept-graph-for-the-concept-of-ratings", "uuid": "<uuid>" }
    ],
    "relationshipTypes": [],
    "relationships": [],
    "imports": [
      {
        "slug": "tapestry--bios",
        "name": "tapestry: BIOS",
        "uuid": "<uuid>"
      }
    ]
  },
  "tapestry": {
    "slug": "grapevine",
    "title": "Grapevine",
    "description": "The collection of all concepts that are integral to using the Grapevine trust engine."
  }
}
```

Note: the Grapevine tapestry's `graph.nodes` lists only the concepts it introduces directly. The BIOS concepts (node types, sets, properties, etc.) are available through the import.

## The `tapestry` section

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | ✅ | Unique kebab-case identifier for this tapestry |
| `title` | string | | Title Case display name |
| `description` | string | | Human-readable description of what this tapestry covers |

The `graph` section follows the standard [graph](./graph.md) format. For tapestries:
- `nodes` — the concept graphs contained in this tapestry
- `imports` — other tapestries whose concepts are included by reference
- `relationshipTypes` and `relationships` — typically empty (inter-concept relationships are recorded within individual concept graphs)

## JSON Schema node

This is the JSON Schema node for the concept of `tapestries`.

The examples above should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-tapestries",
        "title": "JSON Schema for the Concept of Tapestries",
        "name": "JSON Schema for the concept of tapestries",
        "description": "This is the JSON Schema for elements of the concept of tapestries. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema",
            "validationTool"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-tapestries",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "tapestry",
        "title": "Tapestry",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "tapestry"
        ],
        "properties": {
            "tapestry": {
                "type": "object",
                "name": "tapestry",
                "title": "Tapestry",
                "slug": "tapestry",
                "description": "data about this tapestry",
                "required": [
                    "slug"
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
                        "description": "Unique kebab-case identifier for this tapestry"
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
                        "description": "Human-readable description of what this tapestry covers"
                    }
                }
            }
        }
    }
}
```
