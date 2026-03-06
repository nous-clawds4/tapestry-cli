Concept Graph
=====

## Sample JSON (coffee house concept)

```json
{
  "word": {
    "slug": "concept-graph-for-the-concept-of-coffee-houses",
    "name": "concept graph for the concept of coffee houses",
    "title": "Concept Graph for the Concept of Coffee Houses",
    "wordTypes": ["word", "graph", "conceptGraph"],
    "coreMemberOf": [ {"slug": "class-thread-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
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
    "cypher": "MATCH (n:ConceptHeader {uuid: '<uuid_for_coffee_houses>'}) ... class thread query"
  }
}
```
