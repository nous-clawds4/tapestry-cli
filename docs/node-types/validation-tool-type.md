Validation Tool Type
=====

A `validation tool type` classifies the kind of validation mechanism used by a concept. For the conceptual overview, see the [glossary entry](../glossary/validation-tool.md).

This concept parallels [node type](./node-type.md): where node type tells you what kind of *content* a node points to, validation tool type tells you what kind of *validation* a concept uses. The two are closely related — word-based concepts use JSON Schemas, image-based concepts use Image Validation Scripts — but they are distinct concepts.

## Example: `JSON Schema`

The validation tool type for [word](../glossary/word.md)-based concepts. Each word-based concept has its own JSON Schema node that defines the expected structure of its elements' JSON data.

```json
{
  "word": {
    "slug": "validation-tool-type--json-schema",
    "name": "validation tool type: JSON Schema",
    "title": "Validation Tool Type: JSON Schema",
    "description": "A validation tool that checks whether a word node's JSON data conforms to a defined schema.",
    "wordTypes": ["word", "validationToolType"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-validation-tool-types",
        "uuid": "<uuid>"
      }
    ]
  },
  "validationToolType": {
    "slug": "json-schema",
    "name": "JSON Schema",
    "title": "JSON Schema",
    "description": "Validates word-based nodes by checking that their JSON data conforms to a JSON Schema (draft 2020-12). Each word-based concept has its own JSON Schema node as one of its core nodes.",
    "nodeTypeSlug": "word",
    "validationFormat": "json-schema-2020-12"
  }
}
```

## Example: `Image Validation Script`

The validation tool type for [image](../glossary/image.md)-based concepts. Each image-based concept has its own Image Validation Script node that points to a script capable of checking file format integrity.

```json
{
  "word": {
    "slug": "validation-tool-type--image-validation-script",
    "name": "validation tool type: Image Validation Script",
    "title": "Validation Tool Type: Image Validation Script",
    "description": "A validation tool that checks whether an image file conforms to the expected format by running an external script.",
    "wordTypes": ["word", "validationToolType"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-validation-tool-types",
        "uuid": "<uuid>"
      }
    ]
  },
  "validationToolType": {
    "slug": "image-validation-script",
    "name": "Image Validation Script",
    "title": "Image Validation Script",
    "description": "Validates image-based nodes by running a script that checks whether a file is a properly formatted image of the expected type (PNG, JPEG, etc.). Each image-based concept has its own Image Validation Script as one of its core nodes.",
    "nodeTypeSlug": "image",
    "validationFormat": "external-script"
  }
}
```

Note: The `validationToolType` section includes `nodeTypeSlug` (which node type this validation applies to) and `validationFormat` (the mechanism used). These fields are proposals that will be refined as more validation tool types are introduced.

## JSON Schema node

This is the JSON Schema node for the concept of `validation tool types`.

The examples above should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-validation-tool-types",
        "title": "JSON Schema for the Concept of Validation Tool Types",
        "name": "JSON Schema for the concept of validation tool types",
        "description": "This is the JSON Schema for elements of the concept of validation tool types. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-validation-tool-types",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "validation tool type",
        "title": "Validation Tool Type",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "validationToolType"
        ],
        "properties": {
            "validationToolType": {
                "type": "object",
                "name": "validation tool type",
                "title": "Validation Tool Type",
                "slug": "validation-tool-type",
                "description": "data about this validation tool type",
                "required": [
                    "slug",
                    "name"
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
                        "description": "The unique identifier for this validation tool type"
                    },
                    "name": {
                        "type": "string",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
                        "description": "The display name of this validation tool type"
                    },
                    "title": {
                        "type": "string",
                        "name": "title",
                        "title": "Title",
                        "slug": "title",
                        "description": "The title-case display name"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "slug": "description",
                        "description": "A description of this validation tool type"
                    },
                    "nodeTypeSlug": {
                        "type": "string",
                        "name": "node type slug",
                        "title": "Node Type Slug",
                        "slug": "node-type-slug",
                        "description": "The slug of the node type this validation tool applies to"
                    },
                    "validationFormat": {
                        "type": "string",
                        "name": "validation format",
                        "title": "Validation Format",
                        "slug": "validation-format",
                        "description": "The mechanism used for validation (e.g., json-schema-2020-12, external-script)"
                    }
                }
            }
        }
    }
}
```
