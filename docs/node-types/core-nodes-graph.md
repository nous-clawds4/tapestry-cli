Core Nodes Graph
=====

## Example of a Core Nodes Graph

- the `core nodes graph` for the concept of `coffee houses`

It is one of the 8 `core nodes` for the concept of `coffee houses`.

```json
{
  "word": {
    "slug": "core-nodes-graph-for-the-concept-of-coffee-houses",
    "name": "core nodes graph for the concept of coffee houses",
    "title": "Core Nodes Graph for the Concept of Coffee Houses",
    "wordTypes": ["word", "graph", "coreNodesGraph"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "graph": {
    "nodes": [
      {
        "slug": "concept-graph-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      },
      {
        "slug": "concept-header-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      },
      {
        "slug": "core-nodes-graph-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      },
      {
        "slug": "json-schema-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      },
      {
        "slug": "primary-property-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      },
      {
        "slug": "the-set-of-properties-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      },
      {
        "slug": "property-tree-graph-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      },
      {
        "slug": "superset-for-the-concept-of-coffee-houses",
        "uuid": "<uuid>"
      }
    ],
    "relationshipTypes": [
      {
        "slug": "IS_THE_JSON_SCHEMA_FOR",
        "uuid": "<uuid>"
      },
      {
        "slug": "IS_THE_CONCEPT_FOR",
        "uuid": "<uuid>"
      },
      {
        "slug": "IS_THE_PRIMARY_PROPERTY_FOR",
        "uuid": "<uuid>"
      },
      {
        "slug": "IS_THE_PROPERTY_TREE_GRAPH_FOR",
        "uuid": "<uuid>"
      },
      {
        "slug": "IS_THE_CORE_GRAPH_FOR",
        "uuid": "<uuid>"
      },
      {
        "slug": "IS_THE_CONCEPT_GRAPH_FOR",
        "uuid": "<uuid>"
      },
      {
        "slug": "IS_THE_PROPERTIES_SET_FOR",
        "uuid": "<uuid>"
      }
    ],
    "relationships": [
      {
        "nodeFrom": {
          "slug": "concept-header-for-the-concept-of-coffee-houses"
        },
        "relationshipType": {
          "slug": "IS_THE_CONCEPT_FOR"
        },
        "nodeTo": {
          "slug": "superset-for-the-concept-of-coffee-houses"
        }
      },
      {
        "nodeFrom": {
          "slug": "json-schema-for-the-concept-of-coffee-houses"
        },
        "relationshipType": {
          "slug": "IS_THE_JSON_SCHEMA_FOR"
        },
        "nodeTo": {
          "slug": "concept-header-for-the-concept-of-coffee-houses"
        }
      },
      {
        "nodeFrom": {
          "slug": "primary-property-for-the-concept-of-coffee-houses"
        },
        "relationshipType": {
          "slug": "IS_THE_PRIMARY_PROPERTY_FOR"
        },
        "nodeTo": {
          "slug": "concept-header-for-the-concept-of-coffee-houses"
        }
      },
      {
        "nodeFrom": {
          "slug": "property-tree-graph-for-the-concept-of-coffee-houses"
        },
        "relationshipType": {
          "slug": "IS_THE_PROPERTY_TREE_GRAPH_FOR"
        },
        "nodeTo": {
          "slug": "concept-header-for-the-concept-of-coffee-houses"
        }
      },
      {
        "nodeFrom": {
          "slug": "core-nodes-graph-for-the-concept-of-coffee-houses"
        },
        "relationshipType": {
          "slug": "IS_THE_CORE_GRAPH_FOR"
        },
        "nodeTo": {
          "slug": "concept-header-for-the-concept-of-coffee-houses"
        }
      },
      {
        "nodeFrom": {
          "slug": "concept-graph-for-the-concept-of-coffee-houses"
        },
        "relationshipType": {
          "slug": "IS_THE_CONCEPT_GRAPH_FOR"
        },
        "nodeTo": {
          "slug": "concept-header-for-the-concept-of-coffee-houses"
        }
      },
      {
        "nodeFrom": {
          "slug": "the-set-of-properties-for-the-concept-of-coffee-houses"
        },
        "relationshipType": {
          "slug": "IS_THE_PROPERTIES_SET_FOR"
        },
        "nodeTo": {
          "slug": "concept-header-for-the-concept-of-coffee-houses"
        }
      }
    ],
    "imports": [
    ]
  },
  "coreNodesGraph": {
    "description": "the set of core nodes for the concept of coffee houses",
    "constituents": {
      "superset": "<uuid>",
      "jsonSchema": "<uuid>",
      "primaryProperty": "<uuid>",
      "coreNodesGraph": "<uuid>",
      "propertyTreeGraph": "<uuid>",
      "conceptGraph": "<uuid>",
      "properties": "<uuid>",
      "conceptHeader": "<uuid>"
    }
  }
}
```
