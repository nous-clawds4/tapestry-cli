# Node Type

A classification that determines what kind of content a node points to and, consequently, what validation machinery and concept skeleton structure it requires.

The node type is the fork in the road for concept architecture. It determines:

1. **What tag type carries the content** — e.g., a `json` tag for words, an `image` tag for images
2. **How the content is validated** — JSON Schema for words, validation scripts for binary formats
3. **How large the concept skeleton is** — word-based concepts get the full 8 [core nodes](./core-nodes.md) (including the property tree machinery); image-based concepts get a leaner skeleton

## Word

The most common node type. A word node points to structured JSON data via a `json` tag on the nostr event (and a corresponding `NostrEventTag` in Neo4j). The JSON may be embedded directly in the tag value or referenced via a pointer to external storage.

Because JSON is structurally rich, word-based concepts require the full property tree machinery for validation: [JSON Schema](./concept-header.md), [Primary Property](../node-types/primary-property.md), [Properties](../node-types/properties.md) set, and [Property Tree Graph](./property-tree-graph.md) — in addition to the [Concept Header](./concept-header.md), [Superset](./superset.md), [Concept Graph](./concept-graph.md), and [Core Nodes Graph](./core-nodes-graph.md).

## Image

An image node points to a binary image file (PNG, JPEG, WebP, etc.) via an `image` tag on the nostr event, with the tag value containing a path or URL to the file.

Since images are not JSON, they cannot be validated by a JSON Schema. Instead, image-based concepts use an [Image Validation Script](../node-types/image-validation-script.md) — a node that points to a script capable of checking whether a file is a properly formatted image of the expected type.

Image-based concepts have a smaller set of core nodes: Concept Header, Superset, Concept Graph, Core Nodes Graph, and the Image Validation Script. They do not need a Primary Property, Properties set, or Property Tree Graph, because their internal structure is validated by the script rather than decomposed into properties.

## Other Node Types

The pattern generalizes to any content type: video, audio, 3D models, etc. Each would have its own tag type, its own validation mechanism, and its own concept skeleton size. The common thread is that every concept — regardless of node type — has class threads (Concept Header → Superset → Sets → Elements) and a Core Nodes Graph. What varies is the validation machinery.

## Validation Tools as a Unifying Concept

JSON Schemas and Image Validation Scripts are both forms of validation tooling. They can be unified under a concept of "Validation Tools," where the superset of JSON Schemas and the superset of Image Validation Scripts are both subsets of the superset of Validation Tools. This demonstrates that the protocol's own meta-concepts form the same class thread structures as user-created concepts.

## Wrapped and Unwrapped Nodes

Like [relationships](./relationship.md), nodes may be [**wrapped**](./wrapped-data.md) (backed by a dedicated nostr event) or [**unwrapped**](./wrapped-data.md) (existing only as a Neo4j node or as data embedded within a graph event). Most concept nodes today are wrapped, but the protocol does not require it — see [wrapped data](./wrapped-data.md) for the full rationale.

## The Map, Not the Territory

A node is always a *map* — it points to content, it does not *contain* it. For words, the JSON data may currently live inside Neo4j (as a `NostrEventTag` value), but the architecture supports external storage with pointers. For images, the content is always external. This distinction keeps the graph lightweight and the storage flexible.

## See Also
- [Word](./word.md)
- [Word Type](./word-type.md)
- [Core Nodes](./core-nodes.md)
- [Node type spec](../node-types/node-type.md)
