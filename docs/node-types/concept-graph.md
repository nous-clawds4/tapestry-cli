Concept Graph
=====

## Sample JSON (as a core member node for the coffee house concept)

```json
{
  "word": {
    "slug": "concept-graph-for-the-concept-of-coffee-houses",
    "name": "concept graph for the concept of coffee houses",
    "title": "Concept Graph for the Concept of Coffee Houses",
    "wordTypes": ["word", "graph", "conceptGraph"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "graph": {
    "nodes": [
      {
        "slug": "",
        "uuid": "<uuid>"
      }
    ],
    "relationshipTypes": [
      {
        "slug": "IS_THE_CONCEPT_FOR",
        "alias": "class thread initiation",
        "uuid": "<uuid>"
      },
      {
        "slug": "IS_A_SUPERSET_OF",
        "alias": "class thread propagation",
        "uuid": "<uuid>"
      },
      {
        "slug": "HAS_ELEMENT",
        "alias": "class thread termination",
        "uuid": "<uuid>"
      }
    ],
    "relationships": [
      {
        "nodeFrom": {
          "slug": ""
        },
        "relationshipType": {
          "slug": "IS_THE_CONCEPT_FOR"
        },
        "nodeTo": {
          "slug": ""
        }
      },
    ],
    "imports": [
      {
        "slug": "properties-tree-graph-for-the-concept-of-coffee-houses",
        "name": "properties tree graph for the concept of coffee houses",
        "uuid": "<uuid>"
      },
      {
        "slug": "core-nodes-graph-for-the-concept-of-coffee-houses",
        "name": "core nodes graph for the concept of coffee houses",
        "uuid": "<uuid>"
      }
    ]
  },
  "conceptGraph": {
    "description": "The collection of all nodes and edges traversed by the class threads of the concept of coffee houses",
    "cypher": "MATCH classPath = (conceptHeader)-[:IS_THE_CONCEPT_FOR]->(superset:Superset)-[:IS_A_SUPERSET_OF *0..5]->()-[:HAS_ELEMENT]->() WHERE conceptHeader.uuid = '<uuid>' RETURN classPath "
  }
}
```

## JSON Schema node

This is the JSON Schema node for the Concept Header concept.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-concept-graphes",
        "title": "JSON Schema for the concept of Concept Graphs",
        "name": "JSON Schema for the concept of concept graphs",
        "description": "This is the JSON Schema for elements of the concept of concept graphs. Every element of this concept must validate against this JSON schema.",
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
            "conceptGraph"
        ],
        "properties": {
            "conceptGraph": {
                "type": "object",
                "name": "concept graph",
                "title": "Concept Graph",
                "slug": "concept-graph",
                "description": "the collection and nddes and edges traversed by every class thread emanating from the Concept Header node",
                "required": [
                ],
                "unique": [
                ],
                "properties": {
                  "description": {
                    "type": "string",
                    "name": "description"
                  },
                  "cypher": {
                    "type": "string",
                    "name": "cypher",
                    "description": "The cypher command that should return the concept graph for this concept"
                  }
                }
            }
        }
    }
}
```
