Image
=====

An `image` is a [node type](../glossary/node-type.md) for binary image files. For the conceptual definition, see the [glossary entry](../glossary/image.md).

An image node's nostr event carries an `image` tag whose value is a path or URL to the image file. Unlike [words](./word.md), images are not JSON — they cannot be decomposed into properties or validated by a JSON Schema. Instead, image-based concepts use an [Image Validation Script](./image-validation-script.md) that points to an external tool capable of checking file format integrity.

Image-based concepts have a leaner skeleton than word-based concepts:

| Core Node | Word-based | Image-based |
|---|---|---|
| Concept Header | ✅ | ✅ |
| Superset | ✅ | ✅ |
| Concept Graph | ✅ | ✅ |
| Core Nodes Graph | ✅ | ✅ |
| JSON Schema | ✅ | ❌ |
| Primary Property | ✅ | ❌ |
| Properties | ✅ | ❌ |
| Property Tree Graph | ✅ | ❌ |
| Image Validation Script | ❌ | ✅ |

## Example of an `Image`

A PNG image of the Metropolis Coffee Company storefront, belonging to the concept of PNG images:

```json
{
  "word": {
    "slug": "png-image--metropolis-coffee-company-storefront",
    "name": "png image: Metropolis Coffee Company storefront",
    "title": "PNG Image: Metropolis Coffee Company Storefront",
    "description": "A photograph of the Metropolis Coffee Company storefront in Andersonville, Chicago.",
    "wordTypes": ["word", "image"]
  },
  "image": {
    "slug": "metropolis-coffee-company-storefront",
    "name": "Metropolis Coffee Company storefront",
    "path": "images/metropolis-coffee-company-storefront.png",
    "mimeType": "image/png",
    "description": "A photograph of the Metropolis Coffee Company storefront in Andersonville, Chicago."
  }
}
```

Note: the `image.path` field contains the path or URL where the image file can be found. The image itself is external to the graph — the node is a *map* that points to the file, not the file itself. See [node type](../glossary/node-type.md) for more on the map vs. territory distinction.

## Image Validation

Images are validated using external tools rather than JSON Schema. The tapestry project includes two validation tools:

| Format | Tool | Command | Install |
|---|---|---|---|
| PNG | [pngcheck](http://www.libpng.org/pub/png/apps/pngcheck.html) | `pngcheck <file>` | `brew install pngcheck` |
| JPEG | [jpeginfo](https://github.com/tjko/jpeginfo) | `jpeginfo -c <file>` | `brew install jpeginfo` |

Both tools return exit code 0 for valid files and non-zero for invalid files, making them suitable for automated validation.

See [image-validation-script.md](./image-validation-script.md) for how these tools are referenced in the concept graph.

## JSON Schema node

This is the JSON Schema node for the concept of `images`. Note: this schema validates the *word JSON* that describes the image (the map), not the image file itself (the territory). Image file validation is handled by the [Image Validation Script](./image-validation-script.md).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-images",
        "title": "JSON Schema for the Concept of Images",
        "name": "JSON Schema for the concept of images",
        "description": "This is the JSON Schema for the word JSON of image nodes. It validates the metadata that describes an image, not the image file itself.",
        "wordTypes": [
            "word",
            "jsonSchema",
            "validationTool"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-images",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "image",
        "title": "Image",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "image"
        ],
        "properties": {
            "image": {
                "type": "object",
                "name": "image",
                "title": "Image",
                "slug": "image",
                "description": "Metadata about this image node",
                "required": [
                    "slug",
                    "path"
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
                        "description": "Unique identifier for this image"
                    },
                    "name": {
                        "type": "string",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
                        "description": "Human-readable name"
                    },
                    "path": {
                        "type": "string",
                        "name": "path",
                        "title": "Path",
                        "slug": "path",
                        "description": "Path or URL to the image file"
                    },
                    "mimeType": {
                        "type": "string",
                        "name": "MIME type",
                        "title": "MIME Type",
                        "slug": "mime-type",
                        "description": "The MIME type of the image (e.g., image/png, image/jpeg)"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "slug": "description",
                        "description": "Human-readable description of the image"
                    }
                }
            }
        }
    }
}
```
