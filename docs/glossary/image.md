# Image

A [node type](./node-type.md) for binary image files (PNG, JPEG, WebP, etc.). An image node's nostr event carries an `image` tag whose value is a path or URL to the image file, mirrored in Neo4j as a `NostrEventTag`.

Unlike [words](./word.md), images are not JSON and cannot be validated by a JSON Schema. Instead, image-based concepts use an [Image Validation Script](../node-types/image-validation-script.md) to verify that a file conforms to the expected format.

Image-based concepts have a leaner skeleton than word-based concepts. They include a [Concept Header](./concept-header.md), [Superset](./superset.md), [Concept Graph](./concept-graph.md), [Core Nodes Graph](./core-nodes-graph.md), and an Image Validation Script — but no [Primary Property](../node-types/primary-property.md), [Properties](../node-types/properties.md) set, or [Property Tree Graph](./property-tree-graph.md).

Each image format (PNG, JPEG, etc.) may have its own concept with its own validation script, just as each word-based concept has its own JSON Schema. Sub-concepts split when their validation requirements diverge.

## See Also
- [Node Type](./node-type.md)
- [Word](./word.md)
- [Image type spec](../node-types/image.md)
- [Image Validation Script spec](../node-types/image-validation-script.md)
