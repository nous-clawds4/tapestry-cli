Relationship Type
=====

A `relationship type` defines a specific semantic meaning for a directed edge between two nodes. For the conceptual definition and a full table of all relationship types, see the [glossary entry](../glossary/relationship-type.md).

## Example: `IS_THE_CONCEPT_FOR`

The [class thread initiation](../glossary/class-thread-initiation.md) relationship — connects a Concept Header to its Superset.

```json
{
  "word": {
    "slug": "relationship-type--is-the-concept-for",
    "name": "relationship type: IS_THE_CONCEPT_FOR",
    "title": "Relationship Type: IS_THE_CONCEPT_FOR",
    "description": "The class thread initiation relationship. Connects a Concept Header to its Superset, establishing the root of all class threads for that concept.",
    "wordTypes": ["word", "relationshipType"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-relationship-types",
        "uuid": "<uuid>"
      }
    ]
  },
  "relationshipType": {
    "slug": "IS_THE_CONCEPT_FOR",
    "name": "IS_THE_CONCEPT_FOR",
    "title": "Is the Concept For",
    "description": "Connects a Concept Header to its Superset. This is the class thread initiation relationship — every class thread begins with this edge.",
    "nodeFromType": "conceptHeader",
    "nodeToType": "superset",
    "category": "classThread"
  }
}
```

## Example: `HAS_ELEMENT`

The [class thread termination](../glossary/class-thread-termination.md) relationship — connects a Set or Superset to an Element.

```json
{
  "word": {
    "slug": "relationship-type--has-element",
    "name": "relationship type: HAS_ELEMENT",
    "title": "Relationship Type: HAS_ELEMENT",
    "description": "The class thread termination relationship. Connects a Set or Superset to an Element, declaring that element's membership in the set.",
    "wordTypes": ["word", "relationshipType"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-relationship-types",
        "uuid": "<uuid>"
      }
    ]
  },
  "relationshipType": {
    "slug": "HAS_ELEMENT",
    "name": "HAS_ELEMENT",
    "title": "Has Element",
    "description": "Connects a Set or Superset to an Element. This is the class thread termination relationship — every class thread ends with this edge.",
    "nodeFromType": "set",
    "nodeToType": "element",
    "category": "classThread"
  }
}
```

## Example: `IS_THE_JSON_SCHEMA_FOR`

A core node wiring relationship — connects a JSON Schema to its Concept Header.

```json
{
  "word": {
    "slug": "relationship-type--is-the-json-schema-for",
    "name": "relationship type: IS_THE_JSON_SCHEMA_FOR",
    "title": "Relationship Type: IS_THE_JSON_SCHEMA_FOR",
    "description": "Connects a JSON Schema node to its Concept Header, establishing it as the validation mechanism for that concept's elements.",
    "wordTypes": ["word", "relationshipType"],
    "coreMemberOf": [
      {
        "slug": "concept-header-for-the-concept-of-relationship-types",
        "uuid": "<uuid>"
      }
    ]
  },
  "relationshipType": {
    "slug": "IS_THE_JSON_SCHEMA_FOR",
    "name": "IS_THE_JSON_SCHEMA_FOR",
    "title": "Is the JSON Schema For",
    "description": "Connects a JSON Schema node to its Concept Header. The JSON Schema defines the expected structure for all elements of that concept.",
    "nodeFromType": "jsonSchema",
    "nodeToType": "conceptHeader",
    "category": "coreNodeWiring"
  }
}
```

## All Relationship Types

| Slug | Category | From → To |
|---|---|---|
| `IS_THE_CONCEPT_FOR` | Class Thread | Concept Header → Superset |
| `IS_A_SUPERSET_OF` | Class Thread | Superset/Set → Set |
| `HAS_ELEMENT` | Class Thread | Superset/Set → Element |
| `IS_THE_JSON_SCHEMA_FOR` | Core Node Wiring | JSON Schema → Concept Header |
| `IS_THE_PRIMARY_PROPERTY_FOR` | Core Node Wiring | Primary Property → Concept Header |
| `IS_THE_PROPERTIES_SET_FOR` | Core Node Wiring | Properties → Concept Header |
| `IS_THE_PROPERTY_TREE_GRAPH_FOR` | Core Node Wiring | Property Tree Graph → Concept Header |
| `IS_THE_CORE_GRAPH_FOR` | Core Node Wiring | Core Nodes Graph → Concept Header |
| `IS_THE_CONCEPT_GRAPH_FOR` | Core Node Wiring | Concept Graph → Concept Header |
| `IS_A_PROPERTY_OF` | Property Tree | Property → JSON Schema or parent Property |
| `ENUMERATES` | Property Tree | Concept Header → Property |

## JSON Schema node

This is the JSON Schema node for the concept of `relationship types`.

The examples above should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-relationship-types",
        "title": "JSON Schema for the Concept of Relationship Types",
        "name": "JSON Schema for the concept of relationship types",
        "description": "This is the JSON Schema for elements of the concept of relationship types. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema",
            "validationTool"
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-relationship-types",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "relationship type",
        "title": "Relationship Type",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "relationshipType"
        ],
        "properties": {
            "relationshipType": {
                "type": "object",
                "name": "relationship type",
                "title": "Relationship Type",
                "slug": "relationship-type",
                "description": "data about this relationship type",
                "required": [
                    "slug",
                    "name"
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
                        "description": "The SCREAMING_SNAKE_CASE identifier for this relationship type (e.g., IS_THE_CONCEPT_FOR)"
                    },
                    "name": {
                        "type": "string",
                        "name": "name",
                        "title": "Name",
                        "slug": "name",
                        "description": "The canonical name (same as slug for relationship types)"
                    },
                    "title": {
                        "type": "string",
                        "name": "title",
                        "title": "Title",
                        "slug": "title",
                        "description": "Title-case display name"
                    },
                    "description": {
                        "type": "string",
                        "name": "description",
                        "title": "Description",
                        "slug": "description",
                        "description": "What this relationship type represents"
                    },
                    "nodeFromType": {
                        "type": "string",
                        "name": "node from type",
                        "title": "Node From Type",
                        "slug": "node-from-type",
                        "description": "The expected word type of the source node"
                    },
                    "nodeToType": {
                        "type": "string",
                        "name": "node to type",
                        "title": "Node To Type",
                        "slug": "node-to-type",
                        "description": "The expected word type of the target node"
                    },
                    "category": {
                        "type": "string",
                        "name": "category",
                        "title": "Category",
                        "slug": "category",
                        "description": "The broad category: classThread, coreNodeWiring, or propertyTree"
                    },
                }
            }
        }
    }
}
```
