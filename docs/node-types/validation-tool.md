Validation Tool
=====

A `validation tool` is a node that defines how to check whether an [element](../glossary/element.md) of a concept conforms to the concept's expected format. For the conceptual overview, see the [glossary entry](../glossary/validation-tool.md).

The concept of validation tools is organized into subsets by [validation tool type](./validation-tool-type.md):

- **The superset of JSON Schemas** is a subset of the superset of Validation Tools
- **The superset of Image Validation Scripts** is a subset of the superset of Validation Tools

Each individual validation tool (e.g., "JSON Schema for the concept of coffee houses" or "Image Validation Script for the concept of PNG images") is an element of the appropriate subset.

## Example: a JSON Schema (word-based validation)

The [JSON Schema](./json-schema.md) for the concept of coffee houses. This is a validation tool because it defines how to check whether a coffee house element's JSON data is well-formed.

```json
{
  "word": {
    "slug": "json-schema-for-the-concept-of-coffee-houses",
    "name": "JSON Schema for the concept of coffee houses",
    "title": "JSON Schema for the Concept of Coffee Houses",
    "description": "This is the JSON Schema for elements of the concept of coffee houses. Every element of this concept must validate against this JSON schema.",
    "wordTypes": ["word", "jsonSchema", "validationTool"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      }
    ]
  },
  "jsonSchema": {
    "name": "coffee house",
    "title": "Coffee House",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "required": ["coffeeHouse"],
    "properties": {
      "coffeeHouse": {
        "type": "object",
        "description": "..."
      }
    }
  }
}
```

See [json-schema.md](./json-schema.md) for the full JSON Schema documentation.

## Example: an Image Validation Script (image-based validation)

The Image Validation Script for the concept of PNG images. This is a validation tool because it defines how to check whether an image file is a properly formatted PNG.

```json
{
  "word": {
    "slug": "image-validation-script-for-the-concept-of-png-images",
    "name": "image validation script for the concept of png images",
    "title": "Image Validation Script for the Concept of PNG Images",
    "description": "This node tells us how to find the script that validates whether a file is a properly-formatted png image file.",
    "wordTypes": ["word", "imageValidationScript", "validationTool"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-png-images",
        "uuid": "<uuid>"
      }
    ]
  },
  "imageValidationScript": {
    "path-to-script": "<pointer to the script that validates whether an image file is properly formatted as png>"
  }
}
```

See [image-validation-script.md](./image-validation-script.md) for the full Image Validation Script documentation.

## The Validation Tool as a unifying concept

Note that in the examples above, `wordTypes` includes both the specific type (`jsonSchema` or `imageValidationScript`) *and* the parent type (`validationTool`). This reflects the class thread structure: an individual JSON Schema is simultaneously an element of the concept of JSON Schemas and, through subset relationships, an element of the concept of Validation Tools.

This mirrors the same pattern seen with [graphs](./graph.md): a Core Nodes Graph has `wordTypes: ["word", "graph", "coreNodesGraph"]` because it is both a graph and a specific subtype of graph.

## JSON Schema node

This is the JSON Schema node for the concept of `validation tools`. Because validation tools span multiple subtypes with different structures, this schema validates only the common `word` section. Subtype-specific sections (`jsonSchema`, `imageValidationScript`, etc.) are validated by their own concept schemas.

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-validation-tools",
        "title": "JSON Schema for the Concept of Validation Tools",
        "name": "JSON Schema for the concept of validation tools",
        "description": "This is the JSON Schema for elements of the concept of validation tools. Every validation tool must validate against this JSON schema. Subtype-specific sections are validated by their own concept schemas.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-validation-tools",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "validation tool",
        "title": "Validation Tool",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "word"
        ],
        "properties": {
            "word": {
                "type": "object",
                "required": [
                    "slug",
                    "wordTypes"
                ],
                "properties": {
                    "slug": {
                        "type": "string"
                    },
                    "wordTypes": {
                        "type": "array",
                        "contains": {
                            "const": "validationTool"
                        },
                        "description": "Must include 'validationTool' among its word types"
                    }
                }
            }
        }
    }
}
```
