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

### 1.5 Implicit vs. Explicit Relationships

A critical distinction: **most relationships in the concept graph do not have corresponding nostr events.** They are *implicit* — derived by the graph engine from event structure (tags, kind numbers, normalization rules).

#### Implicit Relationships (the norm)

When the graph engine processes a `ListItem` whose `z` tag points to a concept, it creates a `HAS_ELEMENT` relationship in Neo4j. When a Superset node's `z` tag points to the canonical superset concept, the engine labels it as a Superset and wires up `IS_THE_CONCEPT_FOR`. These relationships exist in the graph database but have no dedicated nostr event — they are **inferred from the structure of other events**.

The vast majority of relationships are implicit:
- `IS_THE_CONCEPT_FOR` — inferred from a Superset's z-tag + naming convention
- `IS_A_SUPERSET_OF` — inferred from superset hierarchy tags
- `HAS_ELEMENT` — inferred from an element's z-tag (see also §6.7)
- `IS_A_PROPERTY_OF` — inferred from a property's z-tag or structural tags
- `IS_THE_JSON_SCHEMA_FOR` — inferred from a schema's z-tag or structural tags
- `AUTHORS` — inferred from the event's pubkey
- `HAS_TAG` — inferred from the event's tag array

#### Explicit Relationships (the exception)

An **explicit relationship** is a nostr event — a `ListItem` (kind 39999) whose z-tag points to the "relationship" concept — that formally declares a relationship between two nodes. These events have `nodeFrom`, `nodeTo`, and `relationshipType` tags (see Rule 6).

Explicit relationship events exist for one reason: **when someone wants to communicate a relationship to the community as a first-class piece of data.** Examples include:
- `PROVIDED_THE_TEMPLATE_FOR` — provenance linking a fork to its original
- `IMPORT` — declaring semantic equivalence between concepts
- `SUPERCEDES` — recording an editorial rejection
- `ENUMERATES` — declaring horizontal integration between a superset and a property

These are relationships whose existence is an editorial statement worth publishing, not just a structural consequence of other data.

#### Why not make every relationship explicit?

Consider what would happen: creating an explicit relationship event makes it an element of the "relationship" concept, which means it should have a `HAS_ELEMENT` edge from the relationship concept's Superset. If that `HAS_ELEMENT` also needed an explicit event, that event would itself need a `HAS_ELEMENT` event... and so on, ad infinitum.

The protocol avoids this infinite regress by design. Implicit relationships are the default. Explicit relationship events are reserved for cases where the relationship itself carries editorial or provenance significance worth broadcasting to the network.

#### Implications for agents and tooling

- **Do not expect** a nostr event to exist for every relationship in the Neo4j graph.
- **Do not create** relationship events unless the relationship has editorial significance.
- When checking normalization, the absence of a relationship event is normal — check for the relationship *in the graph*, not for a corresponding event.
- The `tapestry normalize` commands operate on graph-level relationships, not on relationship events.

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

### 2.2 JSON Schema Attachment

Every concept may have an associated **JSON Schema** node that specifies the structure expected of its elements. The JSON Schema connects directly to the concept's Class Thread Header:

```
(schema:JSONSchema:ListItem)-[:IS_THE_JSON_SCHEMA_FOR]->(concept:ClassThreadHeader)
```

The JSON Schema node is a `ListItem` (kind 39999) whose `z` tag points to the canonical "JSON schema" concept. Its `content` field holds the actual JSON Schema definition (a valid JSON object conforming to JSON Schema draft-07 or later).

**Properties** are the building blocks of a JSON Schema. Each property is a separate `ListItem` connected to the schema:

```
(property:Property:ListItem)-[:IS_A_PROPERTY_OF]->(schema:JSONSchema)
```

Together, the JSON Schema and its Properties define the **horizontal structure** of a concept — what fields each element should have, their types, and constraints. This complements the **vertical structure** defined by the class thread (Superset hierarchy, HAS_ELEMENT).

**Full concept structure:**
```
(:Property) ──IS_A_PROPERTY_OF──→ (:JSONSchema) ──IS_THE_JSON_SCHEMA_FOR──→ (concept)
                                                                                |
                                                                      IS_THE_CONCEPT_FOR
                                                                                ↓
                                                                          (:Superset)
                                                                           /       \
                                                                 IS_A_SUPERSET_OF  HAS_ELEMENT
                                                                        ↓              ↓
                                                                   (:Superset)    (:ListItem)
```

**Note:** The JSON Schema replaces the DList-era approach of specifying required tags directly on the ListHeader. Properties are more versatile — they support types, constraints, enumerations, and nesting.

#### ENUMERATES and the `enum` Constraint

When a `Superset` has an `ENUMERATES` relationship to a `Property`, the elements of that Superset define the **allowed values** for that property. This constraint propagates through two layers:

```
(superset:Superset)-[:ENUMERATES]->(property:Property)-[:IS_A_PROPERTY_OF]->(schema:JSONSchema)
```

**Layer 1 — Property event carries the enum.** The `Property` node is the direct target of the `ENUMERATES` relationship. Its `json` tag MUST include an `"enum"` array whose values are the `name` tags of the enumerating Superset's elements. This is the **primary record** of the constraint.

For example, the "type" property of the "property" concept is enumerated by the "superset of all JSON data types." The Property event's `json` tag should be:

```json
{
  "property": {
    "name": "type",
    "type": "string",
    "description": "The JSON data type of the property",
    "enum": ["string", "number", "integer", "boolean", "object", "array", "null"]
  }
}
```

**Layer 2 — JSON Schema aggregates from its Properties.** The concept's `JSONSchema` node assembles its `json` tag by aggregating the constraints from all connected `Property` nodes. When a Property carries an `enum`, the JSON Schema's corresponding property definition MUST include the same `enum` array, conforming to the JSON Schema `enum` keyword (per https://json-schema.org/understanding-json-schema/reference/enum):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "property": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["string", "number", "integer", "boolean", "object", "array", "null"]
        }
      }
    }
  }
}
```

**Direction of authority (cascade):**

```
Enumerating concept's elements (source of truth)
    ↓ determines
Property event's enum array (primary record)
    ↓ propagated to
JSON Schema event's enum array (derived artifact)
```

1. The **concept graph** (elements of the enumerating concept) is the ultimate source of truth.
2. The **Property event** is the primary record of the constraint — it is directly connected to the enumerating Superset via `ENUMERATES`.
3. The **JSON Schema event** is a derived artifact that aggregates from its Properties.

If any layer conflicts with the one above it, the higher layer wins and the lower layer should be updated to match.

**Authorship:** If the Property or JSON Schema event is not authored by the **principal Nostr user** (per Rule 11), a new event must be created by the principal user, and the old event should be superceded. Only the principal user's events are considered authoritative for schema-level constraints.

**Consistency guarantee:** Tooling (e.g., `tapestry normalize`) should detect and flag inconsistencies between:
- `ENUMERATES` relationships and `enum` arrays in Property events
- `enum` arrays in Property events and `enum` arrays in JSON Schema events
When elements are added to or removed from the enumerating concept, the Property and JSON Schema events should be updated accordingly.

#### ENUMERATES and the `enum` Constraint

When a Property has an `ENUMERATES` relationship from a Superset — meaning another concept's elements provide the valid values for that property — the JSON Schema **must** reflect this constraint using the JSON Schema `enum` keyword ([json-schema.org/understanding-json-schema/reference/enum](https://json-schema.org/understanding-json-schema/reference/enum)).

The `enum` keyword restricts a value to a fixed set. In the tapestry protocol, that fixed set is derived from the **element names** of the enumerating concept:

```
(:Superset)-[:ENUMERATES]->(:Property)-[:IS_A_PROPERTY_OF]->(:JSONSchema)
```

**Example:** The "property" concept has a `type` property that is enumerated by "the superset of all JSON data types." The JSON data type concept has elements: `string`, `number`, `integer`, `boolean`, `object`, `array`, `null`. Therefore, the JSON Schema for property must include:

```json
{
  "type": { "type": "string", "enum": ["string", "number", "integer", "boolean", "object", "array", "null"] }
}
```

**Rules:**

1. **Schema must match graph:** When an `ENUMERATES` relationship exists, the corresponding property in the JSON Schema must include an `enum` array whose values are the `name` tag values of the enumerating concept's elements (retrieved via the class thread: Superset → IS_A_SUPERSET_OF* → HAS_ELEMENT, plus implicit elements via z-tag).

2. **Schema is the source of truth for validation:** The `enum` array in the JSON Schema is what tooling uses to validate element data. The `ENUMERATES` relationship in the concept graph is the *source* of the constraint; the `enum` array is its *manifestation* in the schema.

3. **Keeping them in sync:** When elements are added to or removed from the enumerating concept, the JSON Schema's `enum` array must be updated to match. This is a normalization check that can be automated: compare the `enum` values in the schema against the current elements of the enumerating concept.

4. **JSON Schema compliance:** All schemas must conform to the JSON Schema specification (currently [draft 2020-12](https://json-schema.org/specification)). The `enum` keyword, `type`, `required`, `properties`, and other standard keywords should be used per the spec.

### 2.3 Class Thread Examples

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

**Violation types:**
- **DList orphan** (Rule 2 overlap): The item's `z` tag references a parent that doesn't exist in the database. The class thread can't even begin.
- **Class Thread orphan — inferrable**: The item's `z` tag resolves to a valid parent concept that has a Superset, but no explicit `HAS_ELEMENT` relationship exists. The relationship is logically deducible from the z-tag. See §6.7 for when this is an acceptable intentional violation.
- **Class Thread orphan — blocked**: The item's parent exists but has no Superset node, so the class thread is structurally incomplete.

**Fix:** Add a `HAS_ELEMENT` relationship from the concept's root superset (or an appropriate sub-set) to the element. For inferrable orphans, this may be intentionally deferred — see §6.7.

### Rule 4: Elements MUST validate against their concept's rules

Each element of a concept must conform to:
- **Required tags:** as specified by the `ListHeader`'s `required` tags
- **JSON Schema:** if the concept has an associated `JSONSchema` node (connected via `IS_THE_JSON_SCHEMA_FOR`), the element's properties must validate against it

**Violation:** An element missing a required tag, or whose properties fail schema validation.
**Fix:** Add missing tags to the element event, or flag as invalid.

### Rule 5: Superset nodes MUST reference the canonical superset concept

Every `Superset` node's `z` tag must point to one of the recognized "superset" `ListHeader` UUIDs.

### Rule 6: Explicit relationship events MUST have nodeFrom, nodeTo, and relationshipType tags

When a relationship is represented as an explicit nostr event (see §1.5), that `Relationship` `ListItem` must have:
- `nodeFrom` tag: UUID of the source node
- `nodeTo` tag: UUID of the target node  
- `relationshipType` tag: one of the recognized relationship types (IS_THE_CONCEPT_FOR, IS_A_SUPERSET_OF, HAS_ELEMENT, IS_A_PROPERTY_OF, IS_THE_JSON_SCHEMA_FOR, ENUMERATES)

### Rule 7: No hard duplication

**Hard duplication** occurs when the same piece of data exists as two or more distinct nodes in the graph database. This is a database-level integrity problem — the same information occupying two places at once — and is what "normalization" means in the classical relational database sense.

Hard duplication MUST be prevented via uniqueness constraints:
- No two `NostrEvent` nodes should share the same `id` (event ID)
- No two `NostrUser` nodes should share the same `pubkey`
- No two nodes should share the same `aTag`/`uuid` value

```cypher
// Detect hard duplicates by event ID
MATCH (a:NostrEvent), (b:NostrEvent)
WHERE a.id = b.id AND id(a) < id(b)
RETURN a.id AS duplicateEventId, count(*) AS copies
```

**Fix:** Merge duplicate nodes or remove the redundant copy. This should ideally be enforced by Neo4j uniqueness constraints at the database level.

### Rule 8: Soft duplication — resolution via IMPORT and SUPERCEDES

**Soft duplication** occurs when two or more nodes are *intended to serve the same purpose* but are distinct events authored independently. This is not a bug — it is an inherent and expected feature of decentralized collaboration. Multiple authors will independently define overlapping concepts, and that is by design.

**Example:** Alice and Bob each create a Class Thread Header called "internet troll." Same name, similar purpose — but upon close reading, their descriptions may differ in subtle or significant ways. Are they duplicates? Maybe. Maybe not. Such is the nature of decentralized collaboration.

#### Resolution Framework

Soft duplication is resolved through explicit editorial relationships between Class Thread Header nodes:

**IMPORT** — "I agree with your definition, and I want to benefit from your work."

When you IMPORT another author's concept, you are declaring semantic equivalence: your concept and theirs refer to the same thing. This implies that your Superset IS_A_SUPERSET_OF their Superset — meaning their curated elements automatically flow into your concept through the class thread hierarchy.

```
(my "internet troll") -[:IMPORT]-> (Alice's "internet troll")
  implies: (my superset) -[:IS_A_SUPERSET_OF]-> (Alice's superset)
```

IMPORT is composable: if Alice imports Carol's definition, and you import Alice's, you transitively benefit from Carol's curation through the IS_A_SUPERSET_OF chain.

**SUPERCEDES** — "I've seen your definition and I'm replacing it with mine."

When your concept SUPERCEDES another, you are recording a deliberate editorial judgment: you have evaluated their definition and chosen to use your own instead. The superceded node remains in the graph as a permanent record of the rejection. It is non-destructive — you haven't censored anything, you've expressed a preference. And that preference is itself data that the Grapevine can weigh.

```
(my "internet troll") -[:SUPERCEDES]-> (Bob's "internet troll")
```

If Bob disagrees, he can create his own SUPERCEDES pointing the other way. The Grapevine resolves the conflict through community trust scores — this is the essence of **loose consensus**.

#### Same-Author Soft Duplicates

When two concepts with the same name are authored by the *same* pubkey, this typically indicates an error — a concept created twice by accident, or an old version that should have been replaced. For replaceable events (kind 39998/39999), the protocol handles this naturally (newer event replaces older with same d-tag). For non-replaceable events (kind 9998/9999), same-author duplicates should be investigated and one should SUPERCEDE the other.

#### The Role of the Grapevine

When soft duplication accumulates — ten users submit almost-but-not-quite-equivalent definitions of "internet troll" — and you don't care which one to use, but you *do* care about being able to communicate with others, you select the definition that carries the most support from your community. This is **loose consensus**: Alice's and Bob's webs of trust may overlap enough to converge on the same definition without centralized coordination. The demonstration of loose consensus will be one of the greatest triumphs of Tapestry.

### Rule 9: The Class Thread Anomaly

There MUST be exactly one node in the concept graph that is an element of its own Superset — the **Class Thread Header** concept. This node is the origin point of a class thread whose elements are themselves the origin points of all other class threads.

Formally, there must be exactly one node `a` satisfying:

```cypher
MATCH (a)-[:IS_THE_CONCEPT_FOR]->(:Superset)-[:IS_A_SUPERSET_OF*1..]->(c)-[:HAS_ELEMENT]->(a)
RETURN DISTINCT a
```

This query finds any node that initiates a class thread (via IS_THE_CONCEPT_FOR) and is also reachable as an element within that same class thread (via IS_A_SUPERSET_OF → HAS_ELEMENT). The traversal through IS_A_SUPERSET_OF may pass through Superset nodes, Set nodes, or any intermediate node connected by this relationship type.

**Properties of the anomalous node:**
- It is the only node where the initiator and an element of a class thread are the same node
- It is the concept whose elements are all concepts (i.e., all Class Thread Headers)
- Its existence is structurally analogous to the "set of all sets" in set theory — but well-defined and non-paradoxical, because a concept graph is a finite directed graph, not an axiomatic set theory
- In set theory, a set containing itself leads to Russell's Paradox; here, a concept containing itself as an element is an intentional structural singularity

**Violation — too few:** If no node satisfies the query, then the Class Thread Header concept has not been properly initialized.
**Violation — too many:** If more than one node satisfies the query, then the graph has an unintended self-referential cycle that must be investigated and resolved.

**Name:** This rule is called the *Class Thread Anomaly*, after the "integral anomaly" in *The Matrix* — a structurally necessary singularity that the system is designed around rather than despite.

### Rule 10: Concept slugs MUST be locally unique

Every concept in a user's graph must have a unique `slug` tag value. The slug serves as the **namespace key** in element JSON data, where a single element may carry properties from multiple concepts.

#### Why Slugs Matter

A single node can be an element of multiple concepts simultaneously. For example, Fido might be an element of "animal," "dog," and "Irish Setter" — each contributing its own properties. The element's `json` tag stores all of these in a single JSON object, namespaced by concept slug:

```json
["json", "{\"animal\":{\"species\":\"dog\"},\"dog\":{\"name\":\"Fido\",\"breed\":\"Irish Setter\",\"pedigree\":{}},\"irishSetter\":{\"foo\":\"bar\"}}"]
```

The slug is the human-readable key that makes this workable. If two concepts share a slug, the JSON namespacing breaks.

#### The `json` Tag Convention

Element data is stored in a `json` tag (not `content`) on the nostr event:

```
["json", "<stringified JSON object>"]
```

The tag name `json` (not a single letter) is chosen deliberately: nostr relays index single-letter tags, and JSON payloads may be large. Using a multi-letter tag name avoids burdening relay indexes.

The `content` field remains available for human-readable descriptions, notes, or other text.

#### JSON Structure

The JSON object is keyed by concept slug. Each key's value is an object whose properties are defined by that concept's JSON Schema:

```json
{
  "<concept-slug-1>": { "<property>": "<value>", ... },
  "<concept-slug-2>": { "<property>": "<value>", ... }
}
```

Each concept's JSON Schema validates only its own namespace — the object at `json[slug]`. A concept's schema does not need to know about other concepts' properties.

#### Slug Collisions

- **Same author:** A slug collision between two concepts by the same author is a hard error that must be resolved by renaming one concept's slug.
- **Cross-author:** Slug collisions between different authors are resolved through the same IMPORT/SUPERCEDES mechanism as other soft duplication (Rule 8). When two authors' concepts share a slug, the Grapevine determines which definition achieves loose consensus — and with it, which slug mapping is canonical.

#### Slug Derivation

If a concept has an explicit `slug` tag, that value is used. If not, the slug is derived from the concept's `names` tag by converting to camelCase: split on whitespace, lowercase the first word, capitalize the first letter of subsequent words, remove non-alphanumeric characters. Examples: "dog" → `dog`, "Irish Setter" → `irishSetter`, "Dog Breed" → `dogBreed`, "Class Thread Header" → `classThreadHeader`.

Explicit `slug` tags are recommended for concepts where the derived slug would be awkward or ambiguous.

**Violation:** Two concept nodes in the same author's graph have the same slug (whether explicit or derived).
**Fix:** Add an explicit `slug` tag to one concept to disambiguate.

### Rule 11: Every concept MUST have exactly one active JSON Schema node

Every concept node must have **at most one** `JSONSchema` node connected to it via an **explicit** `IS_THE_JSON_SCHEMA_FOR` relationship. When a concept has properties, exactly one active JSON Schema is required. Multiple active JSON Schema nodes pointing to the same concept is a normalization violation that causes duplication artifacts in the UI and ambiguity about which schema is authoritative.

**Scope:** This rule applies only to **explicit** `IS_THE_JSON_SCHEMA_FOR` relationships in the Neo4j graph — not to the implicit relationships inferred from nostr event tags during sync. The underlying nostr events are not modified or deleted. Instead, normalization is enforced at the graph level by:
1. Removing the **implicit** `IS_THE_JSON_SCHEMA_FOR` edge from the deprecated schema(s)
2. Creating an **explicit** `SUPERCEDES` relationship from the active schema to each deprecated schema

The deprecated schema nodes remain in the graph (they are still valid nostr events), but they no longer participate in the concept's active structure. The `SUPERCEDES` relationship provides an audit trail recording that the duplication was evaluated and resolved.

**Violation:** Two or more `JSONSchema` nodes connected to the same concept via `IS_THE_JSON_SCHEMA_FOR`.

```cypher
// Detect concepts with multiple JSON Schema nodes
MATCH (js:JSONSchema)-[:IS_THE_JSON_SCHEMA_FOR]->(h)
WITH h, count(DISTINCT js) AS schemaCount, collect(DISTINCT js) AS schemas
WHERE schemaCount > 1
OPTIONAL MATCH (h)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'})
RETURN h.uuid AS concept, t.value AS name, schemaCount
```

**Resolution heuristic (in priority order):**

1. **Principal author match:** If exactly one schema is authored by the **principal Nostr user** for the concept graph (the pubkey configured as the graph's primary curator — e.g., the Tapestry Assistant), select that schema. The principal user is defined in the graph engine's configuration (`BRAINSTORM_RELAY_NSEC` / default signer).

2. **Content over empty:** If no schema matches the principal author, prefer the schema that has a non-null `json` tag (actual schema content) over one without.

3. **Create new:** If no existing schema is clearly authoritative (e.g., multiple schemas with conflicting content from non-principal authors), create a new `JSONSchema` node authored by the principal user, inheriting the best available content, and wire it to the concept. Supercede the old schemas with `SUPERCEDES` relationship events.

**Resolution steps:**

1. Select the active schema using the heuristic above.
2. For each deprecated schema:
   a. **Remove** the `IS_THE_JSON_SCHEMA_FOR` edge from the deprecated schema to the concept.
   b. **Create** an explicit `SUPERCEDES` relationship event from the active schema to the deprecated schema (per Rule 6).
   c. **Re-wire** any `IS_A_PROPERTY_OF` edges: if a Property node connected to the deprecated schema represents the same property as one on the active schema (same `name` tag), remove the edge to the deprecated schema. If it represents a unique property not on the active schema, re-wire it to the active schema.
3. The deprecated schema node and its nostr event remain untouched.

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

> **Note:** The relationships listed here exist in the Neo4j concept graph. Most are **implicit** — derived by the graph engine from event structure (see §1.5). Only a subset are represented as explicit nostr events (relationship `ListItem`s), typically the editorial and provenance relationships. The "Typical form" column indicates whether a relationship type is usually implicit or explicit.

### Class Thread Relationships

| Relationship | From → To | Phase | Typical Form |
|-------------|-----------|-------|--------------|
| `IS_THE_CONCEPT_FOR` | Class Thread Header → Superset | Initiation | Implicit |
| `IS_A_SUPERSET_OF` | Superset → Superset/Set | Propagation | Implicit |
| `HAS_ELEMENT` | Superset/Set → ListItem/Class Thread Header | Termination | Implicit |

### Concept Structure Relationships

| Relationship | From → To | Purpose | Typical Form |
|-------------|-----------|---------|--------------|
| `IS_A_PROPERTY_OF` | Property → JSONSchema | Defines a property on a schema | Implicit |
| `IS_THE_JSON_SCHEMA_FOR` | JSONSchema → Class Thread Header | Associates a schema with a concept | Implicit |
| `ENUMERATES` | Superset → Property | Horizontal integration | Explicit |

### Editorial Relationships (Soft Duplication Resolution)

| Relationship | From → To | Purpose | Typical Form |
|-------------|-----------|---------|--------------|
| `IMPORT` | Class Thread Header → Class Thread Header | "I agree with your definition and want to benefit from your curated elements." Implies IS_A_SUPERSET_OF between the respective Supersets. | Explicit |
| `SUPERCEDES` | Class Thread Header → Class Thread Header | "I've evaluated your definition and chosen to replace it with mine." Non-destructive rejection — a recorded editorial judgment. | Explicit |

### Provenance Relationships (Forking)

| Relationship | From → To | Purpose | Typical Form |
|-------------|-----------|---------|--------------|
| `PROVIDED_THE_TEMPLATE_FOR` | Original node → Forked node | Records that a node was created by copying and editing another author's node. The original remains in the graph as a provenance record. | Explicit |

#### The Fork Pattern

In a decentralized system, you cannot edit another author's event — only they can publish a replacement (same d-tag, same pubkey). When you want to modify a node you imported from someone else, the standard procedure is:

1. **Copy**: Create a new kind 39999 event that duplicates the original's tags and content, with your edits applied
2. **Swap**: Detach all relationships from the original node and reattach them to your new node, **except** relationships that are intrinsic to the original (see exclusion list below)
3. **Link**: Create a `PROVIDED_THE_TEMPLATE_FOR` relationship from the original to your fork
4. **Retain**: Leave the original node in the graph — it serves as a provenance record and a change-detection anchor

The original node remains connected only via `PROVIDED_THE_TEMPLATE_FOR` and any excluded relationships. If the original author later updates their event, you can compare it against your fork and decide whether to pull their changes.

#### Excluded Relationships (not swapped during fork)

The following relationship types are **not** transferred from the original to the fork by default:

| Relationship | Reason |
|-------------|--------|
| `AUTHORS` | Intrinsic to the original event's creator — authorship doesn't transfer |
| `PROVIDED_THE_TEMPLATE_FOR` | Provenance chain — a new one is created (original → fork), existing ones stay |
| `HAS_TAG` | Internal Neo4j structure — tags belong to the original event, the fork gets its own |

Additional relationship types may be excluded on a case-by-case basis using `--keep-rel <type>` on the `tapestry fork` command. The default exclusion list covers the common cases; edge cases should be evaluated by the operator.

This pattern applies to any node type: Properties, JSONSchemas, Supersets, Relationships, or plain elements. It is the fundamental mechanism for learning from peers while maintaining editorial control over your own concept graph.

```
(Alice's "breed" property) ──PROVIDED_THE_TEMPLATE_FOR──→ (my "breed" property)
                                                               |
                                                        IS_A_PROPERTY_OF
                                                               ↓
                                                    (my "JSON schema for dogs")
```

---

## 6. Intentional Normalization Violations

There are legitimate scenarios where the concept graph will not be fully normalized. These should be tracked and understood rather than blindly "fixed."

### 6.1 Work in Progress

A concept may be partially defined — a `ListHeader` exists but the Superset, Properties, and JSONSchema haven't been created yet. This is the most common violation and represents a concept under construction.

**Policy:** Flag but don't auto-fix unless requested. The `tapestry normalize` command should report these as warnings.

### 6.2 Cross-Author Concepts (Soft Duplication)

When multiple authors define the same concept independently, their class threads are separate. Alice's "nostr relay" concept and Bob's "nostr relay" concept are distinct graphs. This is soft duplication (see Rule 8) — an expected and legitimate feature of decentralized collaboration, not a violation.

**Policy:** Not a violation. Resolve using IMPORT (semantic equivalence) or SUPERCEDES (editorial rejection) as described in Rule 8. The Grapevine determines which definitions achieve loose consensus across the network.

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

### 6.7 Inferrable HAS_ELEMENT Relationships (Graph Compactness Tradeoff)

Rule 3 requires every element to be reachable from its parent concept via a complete class thread, which means an explicit `HAS_ELEMENT` relationship from a Superset to the element must exist in Neo4j. However, this information is **already encoded** in the element's `z` tag — every ListItem's `z` tag points to its parent concept, and if that concept has a Superset node, the `HAS_ELEMENT` relationship is logically inferrable.

For concepts with many elements (e.g., a "playlist" concept with hundreds of songs), creating explicit `HAS_ELEMENT` edges for every item adds potentially thousands of relationships that are entirely redundant with the z-tag data. This bloats the graph without adding new information.

**The tradeoff:**
- **Explicit HAS_ELEMENT:** Enables direct Cypher traversal (`(superset)-[:HAS_ELEMENT]->(item)`). Clean queries, fast graph walks.
- **Inferred from z-tag:** Keeps the graph compact. Queries must join on the z-tag value instead of traversing a relationship, which is slightly more complex but avoids storing redundant edges.

**When to use explicit HAS_ELEMENT:**
- Small concepts (< ~20 items) where the relationship cost is negligible
- Concepts where items have been organized into Sets (the HAS_ELEMENT goes from Set → Item, which is non-redundant structural information)
- Concepts that are frequently queried via class thread traversal

**When to leave inferred:**
- Large, flat concepts with many items not yet organized into Sets
- Concepts under active growth where items are being added frequently
- Situations where graph compactness is prioritized over query convenience

**Policy:** The `check-orphans` command distinguishes between **inferrable orphans** (z-tag resolves, Superset exists, HAS_ELEMENT missing) and **true orphans** (broken z-tag chain). Inferrable orphans are reported for awareness but are a legitimate intentional violation. They can be wired up on demand via `fix-has-element` when explicit traversal is needed.

---

## 7. Normalization Commands

### Implemented

```bash
# Report all normalization violations (Rules 1, 2, 7)
tapestry normalize check

# Detailed view of ListHeaders missing Superset nodes (Rule 1)
tapestry normalize check-supersets

# Create missing Superset nodes + IS_THE_CONCEPT_FOR relationships
tapestry normalize fix-supersets [--dry-run] [--personal]

# Find orphaned ListItems — DList orphans (Rule 2) + Class Thread orphans (Rule 3)
# Distinguishes inferrable orphans (valid z-tag, missing HAS_ELEMENT) from true orphans
tapestry normalize check-orphans
```

### Planned

```bash
# Create HAS_ELEMENT relationships for inferrable orphans
tapestry normalize fix-has-element [--concept <name>] [--dry-run] [--personal]

# Validate elements against JSON schemas (Rule 4)
tapestry normalize validate <concept>

# Full normalization — run all checks
tapestry normalize all
```

---

## 8. Current State

As of 2026-02-28 (post fix-supersets):
- **66 ListHeaders** in the graph (9 without `names` tags — likely non-concept protocol data)
- **All named ListHeaders** have Superset nodes (Rule 1 ✅)
- **2 DList orphans** — Vinney's items referencing kind-9998 parents not in our database
- **115 Class Thread orphans** (87 inferrable, 13 already wired, remainder structural)
- **7 duplicate concepts** (Rule 7) across 3 authors
- **setup.sh** handles labeling and relationship creation but does NOT create missing Superset or HAS_ELEMENT nodes

---

## 9. Safe Workflow: Sync and Import

### 9.1 The Problem

The Neo4j concept graph is populated from strfry via two shell scripts inside the Docker container:

1. **`batchTransfer.sh`** — Scans ALL tapestry events from strfry and MERGEs them into Neo4j (NostrEvent, NostrUser, NostrEventTag nodes + AUTHORS, HAS_TAG, REFERENCES relationships)
2. **`setup.sh`** — Adds labels (ListHeader, ListItem, Set, Superset, etc.) and creates concept-graph relationships (IS_THE_CONCEPT_FOR, IS_A_SUPERSET_OF, HAS_ELEMENT, etc.) using MERGE

Running these scripts is a **full resync**: they re-process every event and re-create every relationship. This means:
- Implicit edges removed by `normalize fix-*` commands get **re-created**
- SUPERCEDES audit trails survive, but the deprecated schemas get re-wired
- It's slow and wasteful when you've only added 1-3 events

### 9.2 Targeted Import (Preferred)

All CLI commands that create events now use **targeted import**: they write the new events to strfry, then execute targeted Cypher queries via the API to create just the necessary Neo4j nodes, tags, labels, and relationships. This:
- Preserves normalization state (no re-creation of removed edges)
- Is fast (only processes the new events)
- Is the default for: `concept add`, `concept schema`, `concept element`, `concept enumerate`, `concept link`, `concept slug`, `set create`, `set add`, `normalize fix-supersets`

### 9.3 Full Resync (Use Sparingly)

Full resync (`batchTransfer.sh` + `setup.sh`) should only be used when:
- Syncing from remote relays (many new events at once)
- The graph is in an inconsistent state that targeted import can't fix
- You need to re-label or re-wire nodes that were modified outside the CLI

The `tapestry sync` command uses full resync and will:
1. **Prompt for confirmation** before running batchTransfer + setup (use `--force` to skip)
2. **Auto-run `normalize check`** after import to flag any issues (use `--skip-normalize` to skip)

### 9.4 Safe Workflow

```
# Normal development: targeted import (automatic, no extra steps needed)
tapestry concept add dog "Golden Retriever"
tapestry concept schema dog --create --content '{...}'

# Syncing from remote relays: full resync + normalize
tapestry sync                    # prompts before resync, auto-checks normalization
tapestry normalize fix-schemas   # if check found issues
tapestry normalize fix-supersets # if check found issues

# Emergency: force full resync without prompts
tapestry sync --force --skip-normalize
```

---

*This document is a living specification. As the tapestry protocol evolves and new patterns emerge, rules and exceptions will be added.*
