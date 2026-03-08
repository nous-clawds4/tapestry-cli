JSON Schema
=====

The `JSON Schema` node defines the validation rules for elements of a concept. Any given element (e.g., a specific coffee house) of a concept (e.g., the concept of coffee houses) must validate against the JSON Schema of that concept.

The JSON Schema is one of the 8 core nodes for any concept. At creation time, it is pre-populated with the structure derived from the primary property (the top-level key and its three default sub-properties: `name`, `slug`, `description`). It is then progressively extended as additional properties are wired to the concept. The `jsonSchema` section mirrors the structure of the property tree, with each property node contributing a fragment.

## Example of a `JSON Schema`

- the `JSON Schema` for the concept of `coffee houses`

It is one of the 8 `core nodes` for the concept of `coffee houses`.

### Initial state

When first created via `create-concept`, the JSON Schema node is pre-populated with the structure derived from the primary property and its three default sub-properties (`name`, `slug`, `description`):

```json
{
  "word": {
    "slug": "json-schema-for-the-concept-of-coffee-houses",
    "name": "JSON schema for the concept of coffee houses",
    "title": "JSON Schema for the Concept of Coffee Houses",
    "description": "the json schema for the concept of coffee houses",
    "wordTypes": ["word", "jsonSchema"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "jsonSchema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "name": "coffee house",
    "title": "Coffee House",
    "description": "JSON Schema for the concept of coffee houses",
    "required": ["coffeeHouse"],
    "definitions": {},
    "properties": {
      "coffeeHouse": {
        "type": "object",
        "name": "coffee house",
        "title": "Coffee House",
        "slug": "coffee-house",
        "description": "data about this coffee house",
        "required": ["name", "slug", "description"],
        "unique": ["name", "slug"],
        "properties": {
          "name": {
            "type": "string",
            "name": "name",
            "slug": "name",
            "title": "Name",
            "description": "The name of the coffee house"
          },
          "slug": {
            "type": "string",
            "name": "slug",
            "slug": "slug",
            "title": "Slug",
            "description": "A unique kebab-case identifier for this coffee house"
          },
          "description": {
            "type": "string",
            "name": "description",
            "slug": "description",
            "title": "Description",
            "description": "A brief description of the coffee house"
          }
        }
      }
    }
  }
}
```

### Populated state

After the primary property and additional properties have been wired, the JSON Schema is assembled from the property tree. The `jsonSchema` section becomes a valid, standalone JSON Schema document ready for validation.

The `word` section remains unchanged. For a full populated example, see the JSON Schema in [coffee-house.md](./coffee-house.md).

## How the JSON Schema is built

At creation time, the `jsonSchema` section is pre-populated with the primary property structure and its three default sub-properties. After that, there are two methods for building it out further:

### Method 1: Schema-first

Edit the JSON Schema directly, then generate the property tree from it.

This is the natural workflow when **fleshing out a new concept for the first time** — writing a JSON Schema is familiar and intuitive, and the system can derive the property tree automatically.

- **Front end:** `Home › Concepts › Detail › JSON Schema` — visual schema editor with save
- **CLI:** `tapestry concept schema <concept> --content '<json>'` — save a schema
- **Then generate the property tree:** `tapestry property generate-tree <concept>` — reads the JSON Schema and creates property events for all properties (recursively for nested objects)
- **Server endpoints:** `POST /api/normalize/save-schema`, `POST /api/normalize/generate-property-tree`

### Method 2: Property-tree-first

Build or modify the property tree, then regenerate the JSON Schema from it.

This is the natural workflow for **horizontal integration** — connecting properties to existing concepts. For example, linking the `type` property of a JSON Schema to the `JSON data types` concept via `ENUMERATES`, or importing the `address` concept's schema into a `coffee house` via `definitions` and `$ref`. These structural connections are expressed in the property tree; the JSON Schema is then rebuilt to reflect them.

- **Front end:** `Home › Concepts › Detail › Properties` — view the property tree
- **CLI:** `tapestry property create <name> --concept <concept>` — create a property and wire it; `tapestry property generate-json-schema <concept>` — rebuild the schema from the tree
- **Server endpoints:** `POST /api/normalize/create-property`, `POST /api/property/generate-json-schema`

### Which method to use?

Both. Schema-first is faster for initial concept authoring. Property-tree-first is essential once concepts are integrated with each other — after adding `ENUMERATES` relationships or cross-concept `$ref` imports, the JSON Schema must be regenerated to stay in sync.

The JSON Schema node is ultimately a **derived artifact** — the canonical, assembled result of the property tree. But the property tree can itself be derived from a JSON Schema. The two representations are kept in sync by explicit generate/rebuild actions, not automatic propagation.

## Relationships

- `IS_THE_JSON_SCHEMA_FOR` → Concept Header (this schema validates elements of that concept)
- Primary Property → `IS_A_PROPERTY_OF` → this JSON Schema (the root property connects here)

## JSON Schema node (meta)

This is the JSON Schema for the concept of `JSON schemas` — i.e., the schema that a JSON Schema node's word JSON must validate against.

```json
{
  "word": {
    "slug": "json-schema-for-the-concept-of-json-schemas",
    "title": "JSON Schema for the Concept of JSON Schemas",
    "name": "JSON Schema for the concept of json schemas",
    "description": "This is the JSON Schema for elements of the concept of json schemas. Every element of this concept must validate against this JSON schema.",
    "wordTypes": ["word", "jsonSchema"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-json-schemas", "uuid": "<uuid>"} ]
  },
  "jsonSchema": {
    "name": "json schema",
    "title": "JSON Schema",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "required": ["jsonSchema"],
    "definitions": {},
    "properties": {
      "jsonSchema": {
        "type": "object",
        "name": "json schema",
        "title": "JSON Schema",
        "slug": "json-schema",
        "description": "A JSON Schema that defines validation rules for elements of a concept.",
        "required": ["$schema", "type", "required", "definitions", "properties"],
        "unique": [],
        "properties": {
          "name": {
            "type": "string",
            "name": "name",
            "title": "Name",
            "slug": "name",
            "description": "The name of the concept this schema validates"
          },
          "title": {
            "type": "string",
            "name": "title",
            "title": "Title",
            "slug": "title",
            "description": "The title of the concept this schema validates"
          },
          "$schema": {
            "type": "string",
            "name": "$schema",
            "title": "Schema URI",
            "slug": "schema-uri",
            "description": "The JSON Schema specification URI"
          },
          "type": {
            "type": "string",
            "name": "type",
            "title": "Type",
            "slug": "type",
            "description": "The top-level type (always 'object')"
          },
          "required": {
            "type": "array",
            "name": "required",
            "title": "Required",
            "slug": "required",
            "description": "Top-level required properties"
          },
          "definitions": {
            "type": "object",
            "name": "definitions",
            "title": "Definitions",
            "slug": "definitions",
            "description": "Reusable schema fragments for cross-concept integration via $ref"
          },
          "properties": {
            "type": "object",
            "name": "properties",
            "title": "Properties",
            "slug": "properties",
            "description": "The property definitions assembled from the property tree"
          }
        }
      }
    }
  }
}
```
