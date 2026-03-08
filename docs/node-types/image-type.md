Image Type
=====

An `image type` classifies a specific image format. Each image type defines the file suffix, MIME type, and the validation tool used to check files of that format. Image types are elements of the concept of image types.

This parallels [JSON data types](./json-data-type.md) in the word domain: where JSON data types classify the kinds of values a property can hold, image types classify the kinds of files an image node can point to.

## Example: `PNG`

```json
{
  "word": {
    "slug": "image-type--png",
    "name": "image type: PNG",
    "title": "Image Type: PNG",
    "description": "Portable Network Graphics — a lossless raster image format with transparency support.",
    "wordTypes": ["word", "imageType"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-image-types",
        "uuid": "<uuid>"
      }
    ]
  },
  "imageType": {
    "slug": "png",
    "name": "PNG",
    "title": "PNG",
    "suffix": ".png",
    "mimeType": "image/png",
    "description": "Portable Network Graphics — a lossless raster image format with transparency support.",
    "validationTool": "pngcheck",
    "validationCommand": "pngcheck <file>"
  }
}
```

## Example: `JPEG`

```json
{
  "word": {
    "slug": "image-type--jpeg",
    "name": "image type: JPEG",
    "title": "Image Type: JPEG",
    "description": "Joint Photographic Experts Group — a lossy compressed raster image format widely used for photographs.",
    "wordTypes": ["word", "imageType"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-image-types",
        "uuid": "<uuid>"
      }
    ]
  },
  "imageType": {
    "slug": "jpeg",
    "name": "JPEG",
    "title": "JPEG",
    "suffix": ".jpg",
    "mimeType": "image/jpeg",
    "description": "Joint Photographic Experts Group — a lossy compressed raster image format widely used for photographs.",
    "validationTool": "jpeginfo",
    "validationCommand": "jpeginfo -c <file>"
  }
}
```

## The `imageType` section

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | ✅ | Unique identifier for this image type |
| `name` | string | ✅ | Display name |
| `title` | string | | Title Case display name |
| `suffix` | string | ✅ | File extension including dot (e.g., `.png`) |
| `mimeType` | string | | MIME type (e.g., `image/png`) |
| `description` | string | | Description of the format |
| `validationTool` | string | | Name of the tool used to validate files of this type |
| `validationCommand` | string | | Command template with `<file>` placeholder |

## JSON Schema node

This is the JSON Schema node for the concept of `image types`.

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-image-types",
        "title": "JSON Schema for the Concept of Image Types",
        "name": "JSON Schema for the concept of image types",
        "description": "This is the JSON Schema for elements of the concept of image types. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema",
            "validationTool"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-image-types",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "image type",
        "title": "Image Type",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "imageType"
        ],
        "properties": {
            "imageType": {
                "type": "object",
                "name": "image type",
                "title": "Image Type",
                "slug": "image-type",
                "description": "data about this image type",
                "required": [
                    "slug",
                    "name",
                    "suffix"
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
                        "description": "Unique identifier for this image type"
                    },
                    "name": {
                        "type": "string",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
                        "description": "Display name of this image type"
                    },
                    "title": {
                        "type": "string",
                        "name": "title",
                        "title": "Title",
                        "slug": "title",
                        "description": "Title Case display name"
                    },
                    "suffix": {
                        "type": "string",
                        "name": "suffix",
                        "title": "Suffix",
                        "slug": "suffix",
                        "description": "File extension including dot (e.g., .png, .jpg)"
                    },
                    "mimeType": {
                        "type": "string",
                        "name": "MIME type",
                        "title": "MIME Type",
                        "slug": "mime-type",
                        "description": "The MIME type for this image format"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "slug": "description",
                        "description": "Description of this image format"
                    },
                    "validationTool": {
                        "type": "string",
                        "name": "validation tool",
                        "title": "Validation Tool",
                        "slug": "validation-tool",
                        "description": "Name of the tool used to validate files of this type"
                    },
                    "validationCommand": {
                        "type": "string",
                        "name": "validation command",
                        "title": "Validation Command",
                        "slug": "validation-command",
                        "description": "Command template with <file> placeholder for validation"
                    }
                }
            }
        }
    }
}
```
