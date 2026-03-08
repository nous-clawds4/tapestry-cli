# Relationship Type

A classification for the directed relationships that can exist between nodes in the concept graph. Each relationship type defines a specific semantic meaning for an edge from one node to another.

Relationship types fall into three broad categories based on their role in the protocol:

## Class Thread Relationships

These define the concept structure itself:

| Relationship Type | From | To | Role |
|---|---|---|---|
| `IS_THE_CONCEPT_FOR` | Concept Header | Superset | [Class thread initiation](./class-thread-initiation.md) |
| `IS_A_SUPERSET_OF` | Superset/Set | Set | [Class thread propagation](./class-thread-propagation.md) |
| `HAS_ELEMENT` | Superset/Set | Element | [Class thread termination](./class-thread-termination.md) |

## Core Node Wiring Relationships

These connect the [core nodes](./core-nodes.md) of a concept to its Concept Header:

| Relationship Type | From | To |
|---|---|---|
| `IS_THE_JSON_SCHEMA_FOR` | JSON Schema | Concept Header |
| `IS_THE_PRIMARY_PROPERTY_FOR` | Primary Property | Concept Header |
| `IS_THE_PROPERTIES_SET_FOR` | Properties | Concept Header |
| `IS_THE_PROPERTY_TREE_GRAPH_FOR` | Property Tree Graph | Concept Header |
| `IS_THE_CORE_GRAPH_FOR` | Core Nodes Graph | Concept Header |
| `IS_THE_CONCEPT_GRAPH_FOR` | Concept Graph | Concept Header |

## Property & Schema Relationships

These define the property tree structure and schema linkage:

| Relationship Type | From | To | Description |
|---|---|---|---|
| `IS_A_PROPERTY_OF` | Property | JSON Schema or parent Property | Wires properties into the property tree |
| `ENUMERATES` | Concept Header | Property | Indicates a concept's elements enumerate the values of a property |

## On Nostr

Each relationship is recorded as a kind 39999 event with tags identifying the `nodeFrom`, `nodeTo`, and `relationshipType`. In Neo4j, these are also stored as direct edges for query performance.

The relationship type itself is an element of the concept of relationship types — a [word](./word.md) node with a `relationshipType` section in its JSON.

## See Also
- [Class Thread](./class-thread.md)
- [Core Nodes](./core-nodes.md)
- [Property](./property.md)
- [Relationship type spec](../node-types/relationship-type.md)
