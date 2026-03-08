Node Type
=====

A `node type` classifies what kind of content a node points to and determines its validation machinery and concept skeleton size. For the conceptual definition, including the distinction between word-based and image-based concepts, see the [glossary entry](../glossary/node-type.md).

This is one of the BIOS concepts — the [Class Thread Anomaly](../glossary/class-thread.md) where the concept's own Superset contains an element ("node type") that refers to itself.

## Example: `word`

The most common node type. A `word` node points to structured JSON data.

```json
{
  "word": {
    "slug": "node-type--word",
    "name": "node type: word",
    "title": "Node Type: Word",
    "description": "A node whose content is structured JSON data, carried in a json tag on the nostr event. Validated by a JSON Schema.",
    "wordTypes": ["word", "nodeType"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-node-types",
        "uuid": "<uuid>"
      }
    ]
  },
  "nodeType": {
    "slug": "word",
    "name": "word",
    "title": "Word",
    "tagType": "json",
    "description": "A node that points to structured JSON data. Word-based concepts use the full 8 core nodes including the property tree machinery (JSON Schema, Primary Property, Properties, Property Tree Graph).",
    "validationConceptSlug": "json-schemas",
    "coreNodeCount": 8
  }
}
```

## Example: `image`

A node type for binary image files. See the [glossary entry](../glossary/image.md) for details.

```json
{
  "word": {
    "slug": "node-type--image",
    "name": "node type: image",
    "title": "Node Type: Image",
    "description": "A node whose content is a binary image file, carried in an image tag on the nostr event. Validated by an Image Validation Script.",
    "wordTypes": ["word", "nodeType"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-node-types",
        "uuid": "<uuid>"
      }
    ]
  },
  "nodeType": {
    "slug": "image",
    "name": "image",
    "title": "Image",
    "tagType": "image",
    "description": "A node that points to a binary image file (PNG, JPEG, WebP, etc.). Image-based concepts use a leaner skeleton: Concept Header, Superset, Concept Graph, Core Nodes Graph, and an Image Validation Script.",
    "validationConceptSlug": "image-validation-scripts",
    "coreNodeCount": 5
  }
}
```

Note: The `nodeType` section includes `tagType` (the nostr event tag that carries the content), `validationConceptSlug` (which concept provides the validation mechanism), and `coreNodeCount` (how many core nodes a concept of this type requires). These fields are proposals — the exact schema will be refined as more node types are introduced.

## JSON Schema node

This is the JSON Schema node for the concept of `node types`.

The examples above should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-node-types",
        "title": "JSON Schema for the Concept of Node Types",
        "name": "JSON Schema for the concept of node types",
        "description": "This is the JSON Schema for elements of the concept of node types. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-node-types",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "node type",
        "title": "Node Type",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "nodeType"
        ],
        "properties": {
            "nodeType": {
                "type": "object",
                "name": "node type",
                "title": "Node Type",
                "slug": "node-type",
                "description": "data about this node type",
                "required": [
                    "slug",
                    "name",
                    "tagType"
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
                        "description": "The unique identifier for this node type"
                    },
                    "name": {
                        "type": "string",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
                        "description": "The display name of this node type"
                    },
                    "title": {
                        "type": "string",
                        "name": "title",
                        "title": "Title",
                        "slug": "title",
                        "description": "The title-case display name"
                    },
                    "tagType": {
                        "type": "string",
                        "name": "tag type",
                        "title": "Tag Type",
                        "slug": "tag-type",
                        "description": "The nostr event tag type that carries the content for nodes of this type (e.g., json, image)"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "slug": "description",
                        "description": "A description of this node type"
                    },
                    "validationConceptSlug": {
                        "type": "string",
                        "name": "validation concept slug",
                        "title": "Validation Concept Slug",
                        "slug": "validation-concept-slug",
                        "description": "The slug of the concept that provides the validation mechanism for this node type (e.g., json-schemas, image-validation-scripts)"
                    },
                    "coreNodeCount": {
                        "type": "integer",
                        "name": "core node count",
                        "title": "Core Node Count",
                        "slug": "core-node-count",
                        "description": "The number of core nodes in the concept skeleton for concepts of this node type"
                    }
                }
            }
        }
    }
}
```
