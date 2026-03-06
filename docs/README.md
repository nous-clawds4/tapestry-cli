# The Tapestry Protocol

> A protocol for decentralized knowledge representation and curation, built on Nostr.

## What Is It?

The tapestry protocol is a method for representing and curating knowledge in a decentralized graph. It allows communities to build shared ontologies — structured vocabularies of concepts, categories, and their relationships — without any central authority deciding what goes in or what it means. Instead, each participant's Web of Trust determines which contributions are trusted, and **loose consensus** emerges naturally from overlapping webs of trust.

The protocol is network-agnostic in principle, but our implementation uses [Nostr](https://nostr.com) for identity, data storage, and transmission.

## The Problem

The decentralized web needs a shared language. Not a language imposed from above, but one that emerges from below — from the people who use it.

Consider a simple question: "What are the best nostr relays?" In a centralized system, someone maintains a list. In a decentralized system, anyone can publish a list — but whose list do you trust? And how do you organize those lists into categories, subcategories, and structured data without a central authority?

This is the problem of **decentralized linguistic consensus**: How does a decentralized group of entities agree on the rules and symbols they use to communicate? The tapestry protocol is our proposed solution.

Just as Nakamoto consensus solved the Byzantine Generals Problem and paved the way for Bitcoin, the tapestry method aims to solve the problem of decentralized linguistic consensus and pave the way for the decentralized web.

## Core Insight

**The curation of a simple list by one's web of trust is the atomic unit of the decentralized web.**

Everything else — categories, schemas, concepts, ontologies — is built up from this one primitive operation: a group of people, weighted by trust, collaboratively curating a list. This operation is called **DCoSL** (Decentralized Curation of Simple Lists).

## Two Subsystems

The tapestry protocol has two major subsystems:

### The Concept Graph — Knowledge Representation

The Concept Graph answers: *How do we structure knowledge?*

Knowledge is represented as a graph of nodes and relationships. The organizing principle is the **[class thread](./glossary/class-thread.md)** — a directed path that connects a specific instance to its abstract category:

```
Concept Header ──(IS_THE_CONCEPT_FOR)──▶ Superset ──(IS_A_SUPERSET_OF)──▶ Set ──(HAS_ELEMENT)──▶ Element
                   initiation                          propagation                  termination
```

The collection of all class threads emanating from a single node defines a **[concept](./glossary/concept.md)**. Concepts can be connected to each other through vertical integration (inheritance), horizontal integration (enumeration of allowed property values by another concept), and shared properties.

A fully-formed concept includes not just its elements and categories, but also a **property tree** (describing the structure of its elements via JSON Schema) and a set of **core nodes** that wire everything together. See [Node Types](./node-types/README.md) for the complete specification.

### The Grapevine — Knowledge Curation

The Grapevine answers: *Whose contributions do we trust, and how much?*

Raw nostr data (follows, mutes, reports, zaps, custom attestations) is **interpreted** — converted into a standardized rating format — and then processed by the **GrapeRank** algorithm to produce **influence scores**:

```
Influence = Average Score × Certainty
```

Where **Certainty** is a function of the number of inputs, mapping rating count to confidence (0–100%). This is key: a user with 10,000 followers but no attestations about relay quality has *low certainty* in the relay-curation context, while a user with 5 detailed relay reviews has *high certainty* in that context.

Trust is always **contextual**. "I trust Alice to curate relays" is independent of "I trust Alice to review restaurants." Context has two dimensions: **actions** (what kind of curation) and **categories** (what domain).

### How They Fit Together

The Concept Graph provides the structure; the Grapevine fills it with curated content. DCoSL is the bridge — it uses the Grapevine's trust scores to curate the lists that populate the Concept Graph. When multiple users' webs of trust overlap sufficiently, their independently-curated lists converge on shared content. This is **[loose consensus](./glossary/loose-consensus.md)**.

## How It Works on Nostr

The tapestry protocol maps to nostr events:

| Nostr Kind | Tapestry Role | Description |
|-----------|---------------|-------------|
| **39998** | [List Header](./glossary/list-header.md) / [Concept Header](./glossary/concept-header.md) | Defines a concept or list (replaceable, addressable) |
| **39999** | [List Item](./glossary/list-item.md) / [Element](./glossary/element.md) | An instance or member of a list (replaceable, addressable) |

Key mechanics:
- **d-tag**: NIP-33 identifier, makes events replaceable and addressable
- **z-tag**: Parent pointer — a list item's z-tag points to its list header's a-tag ([uuid](./glossary/uuid.md)), establishing membership
- **a-tag**: Addressable event reference (`kind:pubkey:d-tag`), used as the canonical identifier (uuid)
- **Replaceable events**: Publishing a new version of a kind 39998/39999 event with the same d-tag supersedes the previous version

Each node's data is stored as a JSON [word](./glossary/word.md) in the event's `content` field, structured according to the node's [word types](./glossary/word-type.md).

## The Strategy

### What We're Building

1. **tapestry-cli** — A command-line tool for managing the concept graph: syncing events from relays, querying Neo4j, creating concepts, and running [normalization](./glossary/normalization.md) checks
2. **tapestry** — A Docker stack (strfry relay + Neo4j + Express API + React UI) that serves as the local development environment and reference implementation
3. **Trust engines** (NosFabrica) — Open-source tools that analyze raw nostr data and produce reliable trust scores, making the Grapevine accessible to any nostr client

### The Path Forward

The protocol is being built incrementally, following the nostr community's convention of modular, adoptable specifications (TIPs — Tapestry Implementation Proposals):

1. **DCoSL** — Simple list curation via Web of Trust *(functional today)*
2. **DCoG** — Decentralized Curation of Graphs: organizing lists into categories and subcategories
3. **DCoPT** — Decentralized Curation of Property Trees: adding structured schemas to concepts
4. **DCoCG** — Decentralized Curation of Concept Graphs: connecting multiple concepts into a unified knowledge graph

Each layer builds on the previous one. The simplest version that works gets built and validated first. In the long run — perhaps 10–20 years — management of the protocol itself will be handed over to the Grapevine, allowing the community to curate the protocol's own evolution.

### Historical Context

The tapestry protocol has been developed over several years across multiple implementations:
- **[Plex](https://github.com/wds4/plex)** — IPFS-era desktop client; proof of concept for the Concept Graph (pre-nostr)
- **[Pretty Good Apps](https://github.com/wds4/pretty-good)** — Nostr desktop client; proof of concept for DCoSL and the Grapevine
- **[Brainstorm](https://github.com/Pretty-Good-Freedom-Tech/brainstorm)** — Web app implementing the Grapevine, live at brainstorm.social
- **tapestry-cli + tapestry** — Current active development; the reference implementation being built now

## Documentation

| Resource | Description |
|----------|-------------|
| [**Glossary**](./glossary/README.md) | Canonical definitions for all tapestry protocol terms |
| [**Node Types**](./node-types/README.md) | JSON specifications for each word type in the concept graph |
| [**Normalization Rules**](./NORMALIZATION.md) | Rules ensuring the concept graph is well-formed |
| [**Reference Library**](../../tapestry-references/INDEX.md) | Articles, NIPs, podcasts, presentations — the full history |

---

*Last updated: 2026-03-06*
