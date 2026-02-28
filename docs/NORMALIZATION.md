# Rules for Tapestry Normalization

A **normalized** tapestry concept graph is one where every node and relationship conforms to the structural rules defined by the tapestry protocol. This document specifies those rules, defines terminology, and catalogs known scenarios where normalization may be intentionally relaxed.

---

## 1. Foundational Concepts

### 1.1 Event Types

| Kind | Label | Description |
|------|-------|-------------|
| 39998 | `ListHeader` | Defines a concept (replaceable, addressable). Allowed but not preferred — see §1.4. |
| 39999 | `ListItem` | An instance/element of a concept (replaceable, addressable). **Preferred for all new events.** |
| 9998 | `ListHeader` | Defines a concept (non-replaceable, legacy). Allowed but not preferred — see §1.4. |
| 9999 | `ListItem` | An instance of a concept (non-replaceable, legacy). Allowed. |

### 1.2 Addressing

Every replaceable event (kind 39998/39999) has an **a-tag** of the form:

```
<kind>:<pubkey>:<d-tag>
```

This serves as the event's stable address across replacements. The `uuid` property on the Neo4j node stores this value.

### 1.3 Parent Pointer (z-tag)

Every `ListItem` has a `z` tag that points to its parent `ListHeader`'s a-tag. This is the fundamental link between items and concepts:

```
["z", "39998:<pubkey>:<d-tag>"]
```

### 1.4 Concepts as Items (Kind Unification)

A key insight of the tapestry protocol: **what makes something a concept is not its event kind — it's its position in the graph.** A node becomes a concept when other nodes reference it via their `z` tag.

Consider the "node type" meta-concept, whose elements include things like "superset," "property," and "JSON schema." Each of these is simultaneously:
- An **element** of the "node type" concept (it's a node type)
- A **concept definition** (other items have z-tags pointing to it)

In the original protocol design, kinds 9998/39998 (`ListHeader`) were reserved for concept definitions, and kinds 9999/39999 (`ListItem`) for instances. But if a ListItem can function as a concept — by having other items point to it — then the kind distinction is unnecessary. A concept is defined by its **role in the graph**, not by its event kind.

#### Policy

- **Preferred:** Use kind 39999 (replaceable ListItem) for all new events, including events that define concepts. A "concept" is any node that other nodes reference as their parent.
- **Allowed:** Kinds 9998 and 39998 (ListHeader) remain valid and legitimate. Many users and existing implementations rely on the ListHeader/ListItem distinction, and there is no requirement to deprecate them. Both ListHeader and ListItem events are valid elements of any concept, including meta-concepts like "node type."
- **Principle:** The graph structure (z-tag references, class threads) determines what is a concept, not the event kind.

This means that the "node type" concept can contain elements of any kind — some may be kind 39998 ListHeaders (created by users who prefer the explicit distinction), and others may be kind 39999 ListItems (created by users who have embraced kind unification). Both are correct.

---

## 2. The Class Thread

A **class thread** is a path through the concept graph that defines how a concept is structured. Every concept, when fully normalized, participates in at least one class thread.

### 2.1 Structure

A class thread has exactly three phases:

```
Initiation → Propagation (0+ hops) → Termination
```

#### Initiation: `Concept → Superset`

Every concept node must be connected to exactly one **Superset** node via an `IS_THE_CONCEPT_FOR` relationship:

```
(concept)-[:IS_THE_CONCEPT_FOR]->(superset:Superset:ListItem)
```

The concept node may be a `ListHeader` (kind 9998/39998) or a `ListItem` functioning as a concept (kind 9999/39999, per §1.4). The Superset node is itself a `ListItem` whose `z` tag points to the canonical "superset" concept.

The Superset is conventionally named "the superset of all \<plural\>", e.g., "the superset of all dogs."

#### Propagation: `Superset → Superset` (0 or more hops)

Supersets can contain sub-supersets, forming a hierarchy:

```
(parent:Superset)-[:IS_A_SUPERSET_OF]->(child:Superset)
```

Example: "the superset of all animals" → "the superset of all dogs" → "the superset of all sheep dogs"

This phase may have zero hops (a flat concept with no sub-categories).

#### Termination: `Superset → Element`

A superset contains concrete elements via `HAS_ELEMENT`:

```
(superset:Superset)-[:HAS_ELEMENT]->(element:ListItem)
```

The element's `z` tag points back to the originating `ListHeader`.

### 2.2 Class Thread Examples

**Minimal (flat concept):**
```
(dog:ListHeader)-[:IS_THE_CONCEPT_FOR]->(allDogs:Superset)-[:HAS_ELEMENT]->(rover:ListItem)
```

**With propagation (hierarchical):**
```
(animal:ListHeader)-[:IS_THE_CONCEPT_FOR]->(allAnimals:Superset)
    -[:IS_A_SUPERSET_OF]->(allDogs:Superset)
        -[:IS_A_SUPERSET_OF]->(allSheepDogs:Superset)
            -[:HAS_ELEMENT]->(rover:ListItem)
```

---

## 3. Normalization Rules

### Rule 1: Every concept MUST have a Superset

Every concept node — whether a `ListHeader` (kind 9998/39998) or a `ListItem` functioning as a concept (kind 9999/39999, per §1.4) — must be connected to exactly one `Superset` node via `IS_THE_CONCEPT_FOR`.

**Violation:** A concept node with no `IS_THE_CONCEPT_FOR` relationship.
**Fix:** Create a `Superset` `ListItem` with `z` tag pointing to the canonical superset concept, and create the `IS_THE_CONCEPT_FOR` relationship.

### Rule 2: Every ListItem MUST have a valid parent pointer

Every `ListItem` must have a `z` tag whose value matches the `uuid` of an existing concept node (whether that concept is a `ListHeader` or a `ListItem` functioning as a concept per §1.4).

**Violation:** A `ListItem` with a `z` tag that references a nonexistent concept node.
**Fix:** Either create the missing concept node or remove the orphaned `ListItem`.

### Rule 3: Every ListItem MUST be reachable via a class thread

Every `ListItem` that is an element (not a Superset, Property, JSONSchema, or Relationship) must be reachable from its parent `ListHeader` through a valid class thread: `ListHeader → IS_THE_CONCEPT_FOR → Superset → (IS_A_SUPERSET_OF)* → HAS_ELEMENT → ListItem`.

**Violation:** An element `ListItem` that exists but has no `HAS_ELEMENT` relationship from any `Superset`.
**Fix:** Add a `HAS_ELEMENT` relationship from the concept's root superset to the element.

### Rule 4: Elements MUST validate against their concept's rules

Each element of a concept must conform to:
- **Required tags:** as specified by the `ListHeader`'s `required` tags
- **JSON Schema:** if the concept has an associated `JSONSchema` node (connected via `IS_THE_JSON_SCHEMA_FOR`), the element's properties must validate against it

**Violation:** An element missing a required tag, or whose properties fail schema validation.
**Fix:** Add missing tags to the element event, or flag as invalid.

### Rule 5: Superset nodes MUST reference the canonical superset concept

Every `Superset` node's `z` tag must point to one of the recognized "superset" `ListHeader` UUIDs.

### Rule 6: Relationship nodes MUST have nodeFrom, nodeTo, and relationshipType tags

Every `Relationship` `ListItem` must have:
- `nodeFrom` tag: UUID of the source node
- `nodeTo` tag: UUID of the target node  
- `relationshipType` tag: one of the recognized relationship types (IS_THE_CONCEPT_FOR, IS_A_SUPERSET_OF, HAS_ELEMENT, IS_A_PROPERTY_OF, IS_THE_JSON_SCHEMA_FOR, ENUMERATES)

### Rule 7: No duplicate concepts

For a given pubkey, there should be at most one `ListHeader` with a given `names` value. Multiple versions from different pubkeys are expected (that's the decentralized part), but duplicates from the same author indicate an error.

### Rule 8: The a-tag (uuid) MUST be unique per node

No two nodes should share the same `aTag`/`uuid` value.

---

## 4. Meta-Concepts (Canonical ListHeaders)

These are the foundational concepts that define the structure of the concept graph itself. They are authored by the protocol designer and referenced by UUID in `defaults.conf`.

| Concept | UUID (a-tag) | Purpose |
|---------|------|---------|
| superset | `39998:e5272...:21cbf5be-...` | Parent concept for all Superset nodes |
| set | `39998:e5272...:6a339361-...` | Parent concept for all Set nodes |
| relationship | `39998:e5272...:c15357e6-...` | Parent concept for all Relationship nodes |
| relationship type | `39998:e5272...:826fa669-...` | Parent concept for Relationship Type definitions |
| property | `39998:e5272...:6c6a1f9e-...` | Parent concept for Property nodes |
| JSON schema | `39998:e5272...:bba896cc-...` | Parent concept for JSONSchema nodes |
| node type | `39998:e5272...:1276c2c4-...` | Parent concept for node type definitions |
| list | `39998:e5272...:cf85c5ea-...` | Parent concept for list definitions |

---

## 5. Recognized Relationship Types

| Relationship | From → To | Phase |
|-------------|-----------|-------|
| `IS_THE_CONCEPT_FOR` | ListHeader → Superset | Initiation |
| `IS_A_SUPERSET_OF` | Superset → Superset | Propagation |
| `HAS_ELEMENT` | Superset → ListItem | Termination |
| `IS_A_PROPERTY_OF` | Property → JSONSchema | Concept structure |
| `IS_THE_JSON_SCHEMA_FOR` | JSONSchema → ListHeader | Concept structure |
| `ENUMERATES` | Superset → Property | Concept structure |

---

## 6. Intentional Normalization Violations

There are legitimate scenarios where the concept graph will not be fully normalized. These should be tracked and understood rather than blindly "fixed."

### 6.1 Work in Progress

A concept may be partially defined — a `ListHeader` exists but the Superset, Properties, and JSONSchema haven't been created yet. This is the most common violation and represents a concept under construction.

**Policy:** Flag but don't auto-fix unless requested. The `tapestry normalize` command should report these as warnings.

### 6.2 Cross-Author Concepts

When multiple authors define the same concept independently, their class threads are separate. Alice's "nostr relay" concept and Bob's "nostr relay" concept are distinct graphs. Web of Trust scoring determines which version(s) to trust, but both are valid in the database.

**Policy:** Not a violation. The graph correctly represents multiple perspectives.

### 6.3 Deprecated / Broken Concepts

Some concepts may be intentionally abandoned (e.g., "dont use - broken :)"). These should be flagged but preserved for historical reference.

**Policy:** Allow a `deprecated` or `broken` tag on ListHeaders. Normalization checks should skip these.

### 6.4 Imported Events from Untrusted Authors

Events synced from relays may include concepts from unknown authors that don't follow the protocol conventions. These are valid nostr events but may not form valid class threads.

**Policy:** Import and store, but normalization checks should be scoped to trusted authors (via GrapeRank scores).

### 6.5 Experimental / Test Concepts

Test concepts created during development (like our "test concept") that exist in strfry but shouldn't be treated as real concepts.

**Policy:** Consider a naming convention (e.g., prefix with "test:" or "dev:") or a dedicated tag to mark test data. Normalization can optionally exclude these.

### 6.6 Tapestry Assistant vs. Personal Identity

Events signed by the Tapestry Assistant (hot key) represent automated/institutional actions. Events signed by a user's personal nsec represent their individual curation. Both are valid but may have different trust weights in GrapeRank.

**Policy:** Not a violation. The pubkey on the event distinguishes the signer. Future GrapeRank contexts may weight these differently.

---

## 7. Normalization Commands (planned)

```bash
# Check normalization status — report all violations
tapestry normalize check

# Fix missing supersets — create Superset nodes for ListHeaders that lack them
tapestry normalize fix-supersets

# Fix orphaned items — report ListItems with invalid z-tag references
tapestry normalize check-orphans

# Validate elements against JSON schemas
tapestry normalize validate <concept>

# Full normalization — run all fixes
tapestry normalize all
```

---

## 8. Current State

As of 2026-02-28:
- **49 ListHeaders** in the graph
- **Only 2** have Superset nodes (dog, Trust Services Request)
- **47 ListHeaders** are missing their class thread initiation
- **3 test concepts** from the Tapestry Assistant that should be cleaned up
- **setup.sh** handles labeling and relationship creation but does NOT create missing Superset nodes

---

*This document is a living specification. As the tapestry protocol evolves and new patterns emerge, rules and exceptions will be added.*
