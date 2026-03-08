Property
=====

A `Property` node represents a single field or attribute in a concept's schema structure. Properties are the building blocks of the [property tree](./property-tree-graph.md) — each one contributes a JSON Schema fragment that is assembled into the concept's full [JSON Schema](./json-schema.md).

For the conceptual definition, see the [glossary entry](../glossary/property.md).

A property is **not** one of the 8 [core nodes](../glossary/core-nodes.md) (though the [Primary Property](./primary-property.md) is). Regular properties are created after the concept exists, either by editing the JSON Schema and generating the property tree, or by creating properties individually. See [How the JSON Schema is built](./json-schema.md#how-the-json-schema-is-built).

## Property hierarchy

Properties form a tree rooted at the concept's JSON Schema node:

```
JSON Schema node
  └─ Primary Property (IS_A_PROPERTY_OF → JSON Schema)
  └─ address (IS_A_PROPERTY_OF → JSON Schema)
       └─ street (IS_A_PROPERTY_OF → address)
       └─ city (IS_A_PROPERTY_OF → address)
```

Top-level properties connect to the JSON Schema node. Nested properties connect to their parent property. The relationship is always `IS_A_PROPERTY_OF`.

## Example of a Property

- `address` is a property of the concept of `coffee houses`

```json
{
  "word": {
    "slug": "address",
    "name": "address",
    "title": "Address",
    "description": "The physical address of the coffee house",
    "wordTypes": ["word", "property"]
  },
  "property": {
    "key": "address",
    "title": "Address",
    "type": "object",
    "description": "The physical address of the coffee house",
    "required": ["street", "city"],
    "properties": {
      "street": { "type": "string" },
      "city": { "type": "string" },
      "state": { "type": "string" },
      "zip": { "type": "string" }
    },
    "x-tapestry": {
      "requiredByParent": false,
      "unique": false
    }
  }
}
```

### The `property` section

The `property` section is a **JSON Schema fragment**. Its structure mirrors the [Primary Property](./primary-property.md)'s `property` section — the primary property is just the root of the tree, and all properties follow the same pattern.

| Field | Type | Required | Description |
|---|---|---|---|
| `key` | string | ✅ | The property name — becomes the key in the parent JSON Schema |
| `type` | string | ✅ | JSON type: `string`, `number`, `integer`, `boolean`, `object`, `array` |
| `title` | string | | Title Case display name |
| `description` | string | | Human-readable description |
| `required` | array | | Which child properties are required (for `object` types) |
| `properties` | object | | Inline child property definitions (for `object` types) |
| `enum` | array | | Valid values, populated via `ENUMERATES` relationships |
| `format` | string | | JSON Schema format hint (e.g., `email`, `uri`, `date`) |
| `pattern` | string | | Regex pattern for string validation |
| `default` | any | | Default value |
| `x-tapestry` | object | ✅ | Tapestry-specific extensions (see below) |

For `type: "object"` properties, child properties exist both inline in `properties` (for schema assembly) and as separate property nodes connected via `IS_A_PROPERTY_OF` (for the property tree graph).

### The `x-tapestry` section

Tapestry-specific metadata that has no equivalent in standard JSON Schema:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `requiredByParent` | boolean | ✅ | `false` | Whether this property is required in its parent object. During schema assembly, the tooling reads this from each child property and builds the parent's `required` array accordingly. |
| `unique` | boolean | ✅ | `false` | Whether this property's value must be unique across all elements of the concept. |

This resolves the tension between the `property` section being a valid JSON Schema fragment and the user's need to declare "this field is required." In standard JSON Schema, `required` is an array on the **parent** object — a property doesn't declare itself required. `x-tapestry.requiredByParent` stores that intent on the property itself, and the schema assembly tooling translates it into the correct parent-level `required` array.

### Relationship to elements

Every property node is also an element of the **concept of properties** — it is wired via `HAS_ELEMENT` from the BIOS property concept's superset. This means properties are themselves a concept that can be browsed, searched, and managed like any other.

## JSON Schema node

This is the JSON Schema node for the concept of `properties`.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-properties",
        "title": "JSON Schema for the Concept of Properties",
        "name": "JSON Schema for the concept of properties",
        "description": "This is the JSON Schema for elements of the concept of properties. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ]
    },
    "jsonSchema": {
        "name": "property",
        "title": "Property",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "property"
        ],
        "properties": {
            "property": {
                "type": "object",
                "name": "property",
                "title": "Property",
                "slug": "property",
                "description": "data about this property",
                "required": [
                    "key",
                    "type"
                ],
                "unique": [],
                "properties": {
                    "key": {
                        "type": "string",
                        "name": "key",
                        "title": "Key",
                        "slug": "key",
                        "description": "The property name — becomes the key in the parent JSON Schema"
                    },
                    "type": {
                        "type": "string",
                        "name": "type",
                        "title": "Type",
                        "slug": "type",
                        "description": "The JSON type (string, number, integer, boolean, object, array)"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "slug": "description",
                        "description": "A human-readable description of this property"
                    },
                    "title": {
                        "type": "string",
                        "name": "title",
                        "title": "Title",
                        "slug": "title",
                        "description": "Title Case display name for this property"
                    },
                    "required": {
                        "type": "array",
                        "name": "required",
                        "title": "Required",
                        "slug": "required",
                        "description": "Which child properties are required (for object types)"
                    },
                    "properties": {
                        "type": "object",
                        "name": "properties",
                        "title": "Properties",
                        "slug": "properties",
                        "description": "Inline child property definitions (for object types)"
                    },
                    "enum": {
                        "type": "array",
                        "name": "enum",
                        "title": "Enum",
                        "slug": "enum",
                        "description": "Valid values, populated via ENUMERATES relationships"
                    },
                    "format": {
                        "type": "string",
                        "name": "format",
                        "title": "Format",
                        "slug": "format",
                        "description": "JSON Schema format hint (e.g. email, uri, date)"
                    },
                    "pattern": {
                        "type": "string",
                        "name": "pattern",
                        "title": "Pattern",
                        "slug": "pattern",
                        "description": "Regex pattern for string validation"
                    },
                    "default": {
                        "type": "string",
                        "name": "default",
                        "title": "Default",
                        "slug": "default",
                        "description": "Default value for this property"
                    },
                    "x-tapestry": {
                        "type": "object",
                        "name": "x-tapestry",
                        "title": "Tapestry Extensions",
                        "slug": "x-tapestry",
                        "description": "Tapestry-specific metadata with no JSON Schema equivalent",
                        "required": ["requiredByParent", "unique"],
                        "properties": {
                            "requiredByParent": {
                                "type": "boolean",
                                "name": "requiredByParent",
                                "title": "Required By Parent",
                                "slug": "required-by-parent",
                                "description": "Whether this property is required in its parent object",
                                "default": false
                            },
                            "unique": {
                                "type": "boolean",
                                "name": "unique",
                                "title": "Unique",
                                "slug": "unique",
                                "description": "Whether this property's value must be unique across all elements",
                                "default": false
                            }
                        }
                    }
                }
            }
        }
    }
}
```
