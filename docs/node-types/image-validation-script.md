Image Validation Script
=====

An `Image Validation Script` is the image-based analogue of a [JSON Schema](./json-schema.md). Where a JSON Schema validates a word's JSON data against a schema definition, an Image Validation Script validates an image file by running an external tool that checks format integrity.

Each image format has its own concept (e.g., "the concept of PNG images", "the concept of JPEG images"), and each of those concepts has its own Image Validation Script pointing to the appropriate tool. This parallels how each word-based concept has its own JSON Schema.

Image Validation Scripts are [validation tools](./validation-tool.md) — the superset of Image Validation Scripts is a subset of the superset of Validation Tools.

## Installed Tools

| Format | Tool | Version | Path | Command |
|---|---|---|---|---|
| PNG | [pngcheck](http://www.libpng.org/pub/png/apps/pngcheck.html) | 4.0.1 | `/opt/homebrew/bin/pngcheck` | `pngcheck <file>` |
| JPEG | [jpeginfo](https://github.com/tjko/jpeginfo) | 1.7.1 | `/opt/homebrew/bin/jpeginfo` | `jpeginfo -c <file>` |

Both tools return exit code 0 for valid files and non-zero for invalid/corrupt files.

## Example: PNG Validation Script

```json
{
  "word": {
    "slug": "image-validation-script-for-the-concept-of-png-images",
    "name": "image validation script for the concept of png images",
    "title": "Image Validation Script for the Concept of PNG Images",
    "description": "Validates whether a file is a properly-formatted PNG image using pngcheck.",
    "wordTypes": ["word", "imageValidationScript", "validationTool"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-png-images",
        "uuid": "<uuid>"
      }
    ]
  },
  "imageValidationScript": {
    "slug": "png-validation",
    "name": "PNG validation script",
    "tool": "pngcheck",
    "toolVersion": "4.0.1",
    "command": "pngcheck <file>",
    "installCommand": "brew install pngcheck",
    "path": "/opt/homebrew/bin/pngcheck",
    "successExitCode": 0,
    "description": "pngcheck tests PNG image files for corruption, displays size, type, compression info. Returns exit code 0 for valid PNG files, non-zero for invalid."
  }
}
```

## Example: JPEG Validation Script

```json
{
  "word": {
    "slug": "image-validation-script-for-the-concept-of-jpeg-images",
    "name": "image validation script for the concept of jpeg images",
    "title": "Image Validation Script for the Concept of JPEG Images",
    "description": "Validates whether a file is a properly-formatted JPEG image using jpeginfo.",
    "wordTypes": ["word", "imageValidationScript", "validationTool"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-jpeg-images",
        "uuid": "<uuid>"
      }
    ]
  },
  "imageValidationScript": {
    "slug": "jpeg-validation",
    "name": "JPEG validation script",
    "tool": "jpeginfo",
    "toolVersion": "1.7.1",
    "command": "jpeginfo -c <file>",
    "installCommand": "brew install jpeginfo",
    "path": "/opt/homebrew/bin/jpeginfo",
    "successExitCode": 0,
    "description": "jpeginfo checks JPEG files for integrity, verifying markers and optionally computing checksums. The -c flag enables checksum verification. Returns exit code 0 for valid JPEG files, non-zero for invalid."
  }
}
```

## The `imageValidationScript` section

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | ✅ | Unique identifier for this validation script |
| `name` | string | | Human-readable name |
| `tool` | string | ✅ | Name of the external validation tool |
| `toolVersion` | string | | Version of the tool this script was tested against |
| `command` | string | ✅ | The command template to run. `<file>` is replaced with the path to the file being validated. |
| `installCommand` | string | | How to install the tool (e.g., `brew install pngcheck`) |
| `path` | string | | Absolute path to the tool binary |
| `successExitCode` | integer | | The exit code that indicates a valid file (typically 0) |
| `description` | string | | Description of what the tool checks |

## JSON Schema node

This is the JSON Schema node for the concept of `image validation scripts`.

The examples above should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-image-validation-scripts",
        "title": "JSON Schema for the Concept of Image Validation Scripts",
        "name": "JSON Schema for the concept of image validation scripts",
        "description": "This is the JSON Schema for elements of the concept of image validation scripts. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema",
            "validationTool"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-image-validation-scripts",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "image validation script",
        "title": "Image Validation Script",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": [
            "imageValidationScript"
        ],
        "definitions": {},
        "properties": {
            "imageValidationScript": {
                "type": "object",
                "name": "image validation script",
                "title": "Image Validation Script",
                "slug": "image-validation-script",
                "description": "data about this image validation script",
                "required": [
                    "slug",
                    "tool",
                    "command"
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
                        "description": "Unique identifier for this validation script"
                    },
                    "name": {
                        "type": "string",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
                        "description": "Human-readable name"
                    },
                    "tool": {
                        "type": "string",
                        "name": "tool",
                        "title": "Tool",
                        "slug": "tool",
                        "description": "Name of the external validation tool"
                    },
                    "toolVersion": {
                        "type": "string",
                        "name": "tool version",
                        "title": "Tool Version",
                        "slug": "tool-version",
                        "description": "Version of the tool this script was tested against"
                    },
                    "command": {
                        "type": "string",
                        "name": "command",
                        "title": "Command",
                        "slug": "command",
                        "description": "The command template to run, with <file> as placeholder for the file path"
                    },
                    "installCommand": {
                        "type": "string",
                        "name": "install command",
                        "title": "Install Command",
                        "slug": "install-command",
                        "description": "How to install the validation tool"
                    },
                    "path": {
                        "type": "string",
                        "name": "path",
                        "title": "Path",
                        "slug": "path",
                        "description": "Absolute path to the tool binary"
                    },
                    "successExitCode": {
                        "type": "integer",
                        "name": "success exit code",
                        "title": "Success Exit Code",
                        "slug": "success-exit-code",
                        "description": "The exit code that indicates a valid file (typically 0)"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "slug": "description",
                        "description": "Description of what the tool checks"
                    }
                }
            }
        }
    }
}
```
