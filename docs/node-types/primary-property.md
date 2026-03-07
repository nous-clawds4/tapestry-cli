Primary Property
=====

The **primary property** is the root container property for a concept. When you describe an element (e.g., a specific coffee house), all its data lives under the primary property key in the JSON. It is both a **property** and a special role (**primaryProperty**), so its JSON has three top-level sections.

## Example of a Primary Property

- the `primary property` for the concept of `coffee houses`

It is one of the 8 `core nodes` for the concept of `coffee houses`.

```json
{
  "word": {
    "slug": "primary-property-for-the-concept-of-coffee-houses",
    "name": "primary property for the concept of coffee houses",
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
    },
    "x-tapestry": {
      "unique": ["name", "slug"],
      "defaults": {
        "required": ["name", "slug", "description"]
      }
    }
  },
  "primaryProperty": {
  }
}
```

## JSON Schema node

This is the JSON Schema node for the concept of `primary properties`.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-primary-properties",
        "title": "JSON Schema for the Concept of Primary Properties",
        "name": "JSON Schema for the concept of primary properties",
        "description": "",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
    },
    "jsonSchema": {
        "name": "",
        "title": "",
        "$schema": "http://json-schema.org/schema",
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
                "slug": "",
                "alias": "",
                "description": "",
                "required": [

                ],
                "unique": [

                ],
                "properties": {
                }
            }
        }
    }
}
```

## Design Decisions

### 1. Three-Layer Structure: `word` → `primaryProperty` → `property`

The JSON mirrors the type hierarchy. Every primary property **is a** property, and every property **is a** word. Code can always find `word` on any node, then inspect `word.wordTypes` to know which other sections to expect.

**Implication:** A regular property node would have `{ word, property }`. An element would have `{ word, element }`. A node that serves multiple roles (e.g., an element that is also a property) would have `{ word, element, property }`. The pattern is additive.

### 2. Identity Lives in `word` Only

`name` and `description` appear **only** in the `word` section. Other sections reference additional semantics but don't repeat identity fields. This avoids sync issues where `word.name` says one thing and `property.name` says another.

### 3. Slug: Kebab-Case, No Hash Suffix

Slugs use kebab-case (`primary-property-for-the-coffee-house-concept`) because they're human-readable identifiers, potentially useful in URLs. CamelCase is reserved for programmatic keys.

**Uniqueness:** Slugs should be practically unique through descriptive naming rather than appended hashes. If collisions occur in practice, a short hash suffix (e.g., `-a3f7`) can be added, but start without one. The `uuid` (a-tag) is the true unique identifier.

### 4. `conceptRef` Instead of `coreNodeOf`

The `primaryProperty` section contains a back-pointer to the concept this property belongs to. Named `conceptRef` rather than `coreNodeOf` because:
- `coreNodeOf` is ambiguous — there are 7 core node types, and this relationship is specifically "I am the primary property **of this concept**"
- `conceptRef` is clear and generic enough to reuse on other node types that need to point back to their parent concept

Contains both `slug` (human-readable) and `uuid` (machine-resolvable) for the class thread header node.

### 5. `property` Section as JSON Schema Fragment

The `property` section is designed to be a **valid JSON Schema fragment**. You can extract it and slot it directly into a parent schema:

```json
{
  "type": "object",
  "properties": {
    "coffeeHouse": {
      "type": "object",
      "title": "Coffee House",
      "required": ["name", "slug", "description"],
      "properties": {
        "name": { "type": "string" },
        "slug": { "type": "string" },
        "description": { "type": "string" }
      }
    }
  }
}
```

This means the concept's JSON Schema can be **assembled** from its property nodes rather than maintained as a separate artifact. The `key` field (`"coffeeHouse"`) becomes the property name in the parent schema.

### 6. Tapestry Extensions: `x-tapestry`

Domain-specific metadata that doesn't belong in standard JSON Schema lives under `x-tapestry`, following the OpenAPI `x-` extension convention:

- **`unique`**: which sub-properties should be unique across elements (no JSON Schema equivalent)
- **`defaults.required`**: the default required fields for new concepts (may be overridden per-concept)

### 7. No `role` in `property` Section

Dave's original proposal included `role: "primaryProperty"` inside the `property` section. This is redundant with `word.wordTypes` which already declares the node's roles. Single source of truth: `wordTypes` is the authority.

### 8. No `uuid` Inside the JSON

The uuid (a-tag: `kind:pubkey:d-tag`) is derivable from the event envelope itself. Storing it inside the JSON content would be circular for the node's own identity. It *is* included in `conceptRef` because that's a reference to a **different** event.

### 9. Neo4j Label: Not Here

Dave's original proposal included a `label` field (`{ name: "CoffeeHouse", required: false }`) for the Neo4j node label. This belongs on the **class thread header** node, not the primary property — the label is a property of the concept itself, not of its primary property. The primary property's `key` happens to match the label name, but the label assignment decision is conceptual.

## Open Questions

- **Should `word.wordTypes` include `"word"` explicitly?** It's always present, so it's technically redundant. But being explicit makes the contract clearer and costs nothing.
- **Sub-properties as separate property nodes?** In this sample, `name`, `slug`, and `description` appear inline. Should they be references to their own property nodes instead? That would enable reuse (the `name` property is the same across many concepts) but adds complexity.
- **`title` in `property` vs `word`?** Currently `title` appears in `property` (as PascalCase display name / Neo4j label candidate) but not in `word`. Should `word` have an optional `title` field too?
- **Default sub-properties:** Every primary property starts with `name`, `slug`, `description`. Should these be hardcoded defaults or configurable per-concept from the start?

## Dave's Original Proposal (for reference)

<details>
<summary>Click to expand</summary>

```js
{
  word: {
    slug: "primary-property-for-the-coffee-house-concept",
    title: "",
    name: "primary property for the coffee house concept",
    description: "primary property for the coffee house concept",
    wordTypes: ["word", "primaryProperty", "property"],
    metaData: {
      uuid: "<>"
    }
  },
  primaryProperty: {
    name: "primary property for the coffee house concept",
    coreNodeOf: {
      slug: "coffeeHouse",
      uuid: "<foo>"
    },
    label: {
      name: "CoffeeHouse",
      required: false
    }
  },
  property: {
    key: "coffeeHouse",
    type: "object",
    name: "coffee house",
    title: "Coffee House",
    role: "primaryProperty",
    required: ["name", "slug", "description"],
    unique: ["name", "slug"],
    properties: {
      name: { type: "string", name: "name" },
      slug: { type: "string", name: "slug" },
      description: { type: "string", name: "description" }
    },
    description: "the primary property for the coffee house concept"
  }
}
```

</details>
