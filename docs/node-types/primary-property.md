Primary Property
=====

The **primary property** is the root of the [property tree](./property-tree-graph.md) for a concept. It connects directly to the concept's [JSON Schema](./json-schema.md) node via `IS_A_PROPERTY_OF` and defines the top-level wrapper key (e.g., `coffeeHouse`) under which all element data is structured.

It is one of the 8 [core nodes](../glossary/core-nodes.md). For the conceptual definition, see the [glossary entry](../glossary/primary-property.md).

The primary property is both a **property** and a **primaryProperty**, so its JSON has three top-level sections: `word`, `property`, and `primaryProperty`. The `property` section is validated by the [JSON Schema for the concept of properties](./property.md); the `primaryProperty` section is validated by the meta-schema below.

## Example of a Primary Property

- the `primary property` for the concept of `coffee houses`

It is one of the 8 `core nodes` for the concept of `coffee houses`.

```json
{
  "word": {
    "slug": "primary-property-for-the-concept-of-coffee-houses",
    "name": "primary property for the concept of coffee houses",
    "title": "Primary Property for the Concept of Coffee Houses",
    "description": "the primary property for the concept of coffee houses",
    "wordTypes": ["word", "property", "primaryProperty"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "property": {
    "key": "coffeeHouse",
    "title": "Coffee House",
    "type": "object",
    "required": ["name", "slug", "description"],
    "properties": {
      "name": { "type": "string" },
      "slug": { "type": "string" },
      "description": { "type": "string" }
    }
  },
  "primaryProperty": {
    "description": "the primary property for the concept of coffee houses"
  }
}
```

### The `property` section as JSON Schema fragment

The `property` section is designed to be a **valid JSON Schema fragment**. The `key` field (`"coffeeHouse"`) becomes the property name in the parent schema, and the rest can be slotted directly into the concept's JSON Schema. This is how the JSON Schema is [assembled from the property tree](./json-schema.md#how-the-json-schema-is-built).

### The naming convention connection

The primary property's `key` is derived from the concept header's `oKeys.singular` (e.g., `coffeeHouse`). This key becomes:
- The top-level property name in the JSON Schema
- The wrapper key in every element's JSON (e.g., `{ "coffeeHouse": { "name": "Metropolis", ... } }`)
- The `title` comes from `oTitles.singular`

## JSON Schema node

This is the JSON Schema node for the concept of `primary properties`.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-primary-properties",
        "title": "JSON Schema for the Concept of Primary Properties",
        "name": "JSON Schema for the concept of primary properties",
        "description": "This is the JSON Schema for elements of the concept of primary properties. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-primary-properties",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "primary property",
        "title": "Primary Property",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "primaryProperty"
        ],
        "properties": {
            "primaryProperty": {
                "type": "object",
                "name": "primary property",
                "title": "Primary Property",
                "slug": "primary-property",
                "description": "data about this primary property",
                "required": [
                    "description"
                ],
                "unique": [],
                "properties": {
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "slug": "description",
                        "description": "A description of this primary property"
                    }
                }
            }
        }
    }
}
```

## Design Decisions

### Three-Layer Structure: `word` → `property` → `primaryProperty`

The JSON mirrors the type hierarchy. Every primary property **is a** property, and every property **is a** word. Code can always find `word` on any node, then inspect `word.wordTypes` to know which other sections to expect.

**Implication:** A regular property node has `{ word, property }`. A primary property has `{ word, property, primaryProperty }`. The pattern is additive — each word type adds a section.

### Identity Lives in `word` Only

`name` and `description` appear in the `word` section. Other sections contain domain-specific semantics but don't repeat identity fields. This avoids sync issues where `word.name` says one thing and another section says something different.

### `coreMemberOf` for Back-References

The `word.coreMemberOf` array provides back-pointers to the concept header this node belongs to. This is the standard mechanism for all core nodes to reference their parent concept.

### Slug Convention

Slugs use kebab-case (`primary-property-for-the-concept-of-coffee-houses`) for human readability. CamelCase is reserved for programmatic keys (like `property.key`). The `uuid` (a-tag) is the true unique identifier; slugs should be practically unique through descriptive naming.

### No Redundant Role in `property`

The node's roles are declared in `word.wordTypes` — single source of truth. The `property` section doesn't need a `role` field.

### No `uuid` Inside the JSON

The uuid (a-tag: `kind:pubkey:d-tag`) is derivable from the event envelope. Storing it inside the JSON content would be circular. It *is* included in `coreMemberOf` because that references a **different** event.
