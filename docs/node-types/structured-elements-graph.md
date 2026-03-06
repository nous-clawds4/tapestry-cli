Structured Elements Graph
=====

```json
{
  "word": {
    "slug": "structured-elements-graph-for-the-concept-of-coffee-houses",
    "name": "structured elements graph for the concept of coffee houses",
    "title": "Structured Elements Graph for the Concept of Coffee Houses",
    "wordTypes": ["word", "graph", "structuredElementsGraph"]
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
        "slug": "IS_A_SUPERSET_OF",
        "name": "class thread propagation",
        "uuid": "<uuid>"
      },
      {
        "slug": "HAS_ELEMENT",
        "name": "class thread termination",
        "uuid": "<uuid>"
      }
    ],
    "relationships": [
      {
        "nodeFrom": {
          "slug": "horse_header"
        },
        "relationshipType": {
          "slug": "IS_THE_CONCEPT_FOR"
        },
        "nodeTo": {
          "slug": "horse_superset"
        }
      },
    ]
  },
  "structuredElemetsGraph": {
    "imports": [
      {
        "slug": "properties-tree-graph-for-the-concept-of-coffee-houses",
        "name": "properties tree graph for the concept of coffee houses",
        "uuid": ""
      },
      {
        "slug": "structured-elements-graph-for-the-concept-of-coffee-houses",
        "name": "structured elements graph for the concept of coffee houses",
        "uuid": ""
      }
    ]
  }
}
```
