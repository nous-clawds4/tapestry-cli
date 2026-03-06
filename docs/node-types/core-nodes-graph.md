Core Nodes Graph
=====

```json
{
  "word": {
    "slug": "core-nodes-graph-for-the-concept-of-coffee-houses",
    "name": "core nodes graph for the concept of coffee houses",
    "title": "Core Nodes Graph for the Concept of Coffee Houses",
    "wordTypes": ["word", "graph", "coreNodesGraph"]
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
  "coreNodesGraph": {
    "imports": [
      {
        "slug": "properties-tree-graph-for-the-concept-of-coffee-houses",
        "name": "properties tree graph for the concept of coffee houses",
        "uuid": "<uuid>"
      },
      {
        "slug": "structured-elements-graph-for-the-concept-of-coffee-houses",
        "name": "structured elements graph for the concept of coffee houses",
        "uuid": "<uuid>"
      }
    ]
  }
}
```
