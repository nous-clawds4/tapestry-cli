# Validation Tool

A node that defines how to check whether an [element](./element.md) of a concept conforms to the concept's expected format. Validation tools are the mechanism by which the tapestry protocol ensures data integrity across different [node types](./node-type.md).

The superset of all validation tools encompasses multiple subsets:

- **[JSON Schemas](../node-types/json-schema.md)** — validate [word](./word.md)-based nodes by checking that their JSON data conforms to a schema
- **[Image Validation Scripts](../node-types/image-validation-script.md)** — validate [image](./image.md)-based nodes by running a script that checks file format integrity

This structure demonstrates a key property of the tapestry protocol: its own meta-concepts (validation tools, node types, etc.) form the same class thread structures as user-created concepts. The superset of JSON Schemas and the superset of Image Validation Scripts are both subsets of the superset of Validation Tools.

New validation tool types can be introduced as new node types are added to the protocol (video, audio, 3D models, etc.).

## See Also
- [Node Type](./node-type.md)
- [JSON Schema spec](../node-types/json-schema.md)
- [Image Validation Script spec](../node-types/image-validation-script.md)
