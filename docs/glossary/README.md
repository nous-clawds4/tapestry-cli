# Glossary

> Canonical definitions for the tapestry protocol. When in doubt, this is the authority.

## Node Types

- [**Node Type**](./node-type.md) — what kind of content a node points to (word, image, etc.)
- [**Word**](./word.md) — a node whose content is structured JSON data
- [**Word Type**](./word-type.md) — a classification assigned to a word
- [**Image**](./image.md) — a node whose content is a binary image file

## Identity & Naming Conventions

- [**Slug**](./slug.md) — kebab-case human-readable identifier
- [**Key**](./key.md) — camelCase programmatic identifier
- [**Name**](./name.md) — lowercase human-readable label
- [**Title**](./title.md) — PascalCase display name / Neo4j label
- [**UUID**](./uuid.md) — the a-tag; true unique identifier

## Class Threads

- [**Class Thread**](./class-thread.md) — the fundamental organizing structure of the concept graph
- [**Class Thread Initiation**](./class-thread-initiation.md) — IS_THE_CONCEPT_FOR relationship
- [**Class Thread Propagation**](./class-thread-propagation.md) — IS_A_SUPERSET_OF relationship
- [**Class Thread Termination**](./class-thread-termination.md) — HAS_ELEMENT relationship

## Concept

- [**Concept**](./concept.md) — three related meanings; defined by position in the graph
- [**Proto Concept**](./proto-concept.md) — structure of a concept but no instances yet
- [**Concept Header**](./concept-header.md) — the root node of a concept (aka class thread header)

## Graph Nodes

- [**Superset**](./superset.md) — the universal set for a concept
- [**Set**](./set.md) — a subset of elements within a concept
- [**Element**](./element.md) — an individual instance of a concept
- [**List Header**](./list-header.md) — any node that has list items
- [**List Item**](./list-item.md) — an element of a list header

## Core Nodes

- [**Core Nodes**](./core-nodes.md) — the 8 nodes that constitute a fully-formed concept

## Properties

- [**Property**](./property.md) — a field/attribute of a concept's elements
- [**Primary Property**](./primary-property.md) — the root container property for a concept

## Graphs

- [**Property Tree Graph**](./property-tree-graph.md) — schema structure as a tree
- [**Core Nodes Graph**](./core-nodes-graph.md) — all core nodes and their interconnections
- [**Concept Graph**](./concept-graph.md) — all nodes and edges of a concept's class threads
- [**Tapestry**](./tapestry.md) — union of many concept graphs; validates against normalization rules

## Relationships

- [**Relationship**](./relationship.md) — a directed edge between two nodes (nostr event + Neo4j edge)
- [**Relationship Type**](./relationship-type.md) — the semantic meaning of a relationship (IS_THE_CONCEPT_FOR, HAS_ELEMENT, etc.)

## Data Architecture

- [**Wrapped Data**](./wrapped-data.md) — the distinction between entities backed by a nostr event (wrapped) and those that exist only locally or embedded in other events (unwrapped)

## Validation

- [**Validation Tool**](./validation-tool.md) — a node that defines how to validate elements of a concept

## Higher-Level Concepts

- [**Normalization**](./normalization.md) — rules ensuring the concept graph is well-formed
- [**Loose Consensus**](./loose-consensus.md) — decentralized convergence on shared lists via Web of Trust
- [**Duality**](./duality.md) — the same data represented both in graph topology and in serialized documents

---

*Last updated: 2026-03-08*
