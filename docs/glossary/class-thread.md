# Class Thread

The fundamental organizing structure of the concept graph. A directed path through the graph consisting of three phases:

1. **Initiation** — a single [IS_THE_CONCEPT_FOR](./class-thread-initiation.md) relationship from a Concept Header to a Superset
2. **Propagation** — zero or more [IS_A_SUPERSET_OF](./class-thread-propagation.md) relationships from Superset through Sets
3. **Termination** — a [HAS_ELEMENT](./class-thread-termination.md) relationship from a Set (or Superset) to an Element

Every class thread emanates from a single [Concept Header](./concept-header.md) node. The collection of all nodes and edges traversed by all class threads from one Concept Header defines a [concept](./concept.md).

## See Also
- [Concept](./concept.md)
- [Concept Header](./concept-header.md)
- [Superset](./superset.md)
- [Set](./set.md)
- [Element](./element.md)
