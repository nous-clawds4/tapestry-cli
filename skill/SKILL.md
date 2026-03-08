# Tapestry Skill

Interact with a running Tapestry instance — a concept graph built on Nostr and Neo4j using the Tapestry Protocol.

## Architecture

- **Tapestry server** (Docker): the brain — strfry relay, Neo4j, Express API
- **tapestry-cli**: thin client for agents — all commands call server API endpoints
- **React front end**: for humans — served at `http://localhost:5173/kg/` (dev) or `http://localhost:8080/kg/` (production)

All three use the same API at `http://localhost:8080`.

## Prerequisites

- Docker stack running: `cd ~/repos/nous-clawds4/tapestry && docker compose up -d`
- Services: strfry (relay), Neo4j (concept graph), Brainstorm (web app + API)
- CLI installed via `npm link` from `~/repos/nous-clawds4/tapestry-cli`

## Repo Locations

- **tapestry-cli:** `~/repos/nous-clawds4/tapestry-cli` (GitHub: nous-clawds4/tapestry-cli)
- **tapestry (brainstorm fork):** `~/repos/nous-clawds4/tapestry` (concept-graph branch)
- **Docs:** `~/repos/nous-clawds4/tapestry-cli/docs/` (glossary, node-types, NORMALIZATION.md)

## CLI Commands

### `tapestry status`
Show health of all services (Neo4j, strfry, network, ranking, lists).

### `tapestry query [cypher]`
Run a Cypher query against the Neo4j concept graph.

```bash
# List all concepts
tapestry query "MATCH (h:ConceptHeader) RETURN h.name ORDER BY h.name"

# Count nodes by label
tapestry query "MATCH (n) RETURN labels(n) AS label, count(n) AS cnt ORDER BY cnt DESC"
```

**⚠️ Quoting:** Use single quotes for Cypher string values. Double quotes get consumed by the shell.

### `tapestry concept`

| Subcommand | Description |
|---|---|
| `create <name> [--plural X --description Y]` | Create concept with full 8-node skeleton |
| `add <concept> <item-name>` | Add an element to a concept |
| `link <parent> [--child X]` | Link concepts: parent IS_A_SUPERSET_OF child |
| `element <concept> [--parent X]` | Declare concept as element of another (vertical integration) |
| `enumerate <enumerating> [--property X --target Y]` | Create ENUMERATES relationship (horizontal integration) |
| `schema <concept>` | Show, create, or update JSON Schema |
| `slug <concept> [value]` | Show or set the slug (JSON namespace key) |
| `list` | List all concepts |

### `tapestry set`

| Subcommand | Description |
|---|---|
| `create <name> [--concept X]` | Create a Set node within a concept |
| `add <set> <item>` | Add an item to a Set via HAS_ELEMENT |
| `list` | List all Sets |

### `tapestry property`

| Subcommand | Description |
|---|---|
| `create <name> [--concept X --parent Y --data-type Z]` | Create a property |
| `generate-tree <concept>` | Generate property tree from JSON Schema |
| `generate-json-schema <concept>` | Generate JSON Schema from property tree |

### `tapestry normalize`

| Subcommand | Description |
|---|---|
| `check` | Report all normalization violations |
| `check-supersets` | Find ListHeaders missing Superset nodes |
| `check-orphans` | Find orphaned ListItems |
| `check-schemas` | Find concepts with multiple JSON Schemas (Rule 11) |
| `fix-supersets` | Create missing Superset nodes |
| `fix-schemas` | Resolve duplicate JSON Schemas |
| `skeleton <concept>` | Create missing core nodes for a concept |
| `json <concept>` | Regenerate JSON tags for skeleton nodes |

### `tapestry audit`

| Subcommand | Description |
|---|---|
| `health` | Full health check — all audit checks with summary |
| `concept <name>` | Health check for a single concept |
| `stats` | Quick summary: node/relationship/concept counts |
| `skeletons` | Check for missing core nodes |
| `orphans` | Find broken/missing parent references |
| `wiring` | Check relationship type mismatches |
| `labels` | Find nodes missing expected Neo4j labels |

### `tapestry event`

| Subcommand | Description |
|---|---|
| `check <uuid>` | Check if event exists in Neo4j, compare with strfry |
| `update <uuid>` | Update replaceable event in Neo4j from strfry |
| `set-json <uuid> [json]` | Set or remove the json tag on a replaceable event |
| `import [--kind X --author Y]` | Import events from strfry into Neo4j |

### `tapestry fork <node-name>`
Fork another author's node — copy, swap relationships, link provenance.

### `tapestry config`
Manage CLI configuration (UUIDs, relays, API URL).

## Server API Endpoints

### Read (no auth)
- `GET /api/neo4j-status` — Neo4j health + counts
- `GET /api/strfry-status` — strfry health + event counts
- `GET /api/neo4j/run-query?cypher=<url-encoded>` — run Cypher queries
- `GET /api/strfry/scan` — scan strfry events
- `GET /api/neo4j/event-check?uuid=<uuid>` — check event sync status

### Write (normalize)
- `POST /api/normalize/create-concept` — create concept with full skeleton
- `POST /api/normalize/create-element` — add element to concept
- `POST /api/normalize/link-concepts` — wire parent IS_A_SUPERSET_OF child
- `POST /api/normalize/enumerate` — create ENUMERATES relationship
- `POST /api/normalize/set-slug` — set concept slug
- `POST /api/normalize/create-set` — create Set node
- `POST /api/normalize/add-to-set` — add item to Set
- `POST /api/normalize/fork-node` — fork another author's node
- `POST /api/normalize/set-json-tag` — set/remove json tag on event
- `POST /api/normalize/save-schema` — save JSON Schema
- `POST /api/normalize/save-element-json` — save element JSON
- `POST /api/normalize/create-property` — create property node
- `POST /api/normalize/generate-property-tree` — generate tree from schema
- `POST /api/normalize/add-node-as-element` — add node as element of concept
- `POST /api/normalize/skeleton` — create missing skeleton nodes
- `POST /api/normalize/json` — regenerate JSON tags

### Write (events)
- `POST /api/strfry/publish` — publish event (NIP-07 client signing or TA server signing)
- `POST /api/neo4j/event-update` — update/import event in Neo4j

## Neo4j Schema

### Node Labels
- `NostrEvent` — base label for all imported nostr events
- `ListHeader` — kind 39998 concept definitions
- `ListItem` — kind 39999 concept instances
- `ConceptHeader` — ListHeaders that are concept origins (have IS_THE_CONCEPT_FOR)
- `Superset` — superset nodes
- `Property` — property nodes
- `JSONSchema` — JSON Schema nodes
- `NostrUser` — pubkeys that authored events
- `NostrEventTag` — individual tags from events

### Key Tag Types
- `names` — on ListHeaders: `value` = singular, `value1` = plural
- `name` — on ListItems: `value` = item name
- `d` — NIP-33 d-tag identifier
- `a` — addressable event reference (a-tag)
- `z` — parent pointer (points to parent ListHeader's a-tag)
- `json` — structured JSON data for the node's word content

### Relationships
**Structural:**
- `(:NostrUser)-[:AUTHORS]->(:NostrEvent)`
- `(:NostrEvent)-[:HAS_TAG]->(:NostrEventTag)`

**Class Threads:**
- `IS_THE_CONCEPT_FOR` — Concept Header → Superset
- `IS_A_SUPERSET_OF` — Superset/Set → Set
- `HAS_ELEMENT` — Superset/Set → Element

**Core Node Wiring:**
- `IS_THE_JSON_SCHEMA_FOR` — JSON Schema → Concept Header
- `IS_THE_PRIMARY_PROPERTY_FOR` — Primary Property → Concept Header
- `IS_THE_PROPERTIES_SET_FOR` — Properties → Concept Header
- `IS_THE_PROPERTY_TREE_GRAPH_FOR` — Property Tree Graph → Concept Header
- `IS_THE_CORE_GRAPH_FOR` — Core Nodes Graph → Concept Header
- `IS_THE_CONCEPT_GRAPH_FOR` — Concept Graph → Concept Header

**Property Tree:**
- `IS_A_PROPERTY_OF` — Property → JSON Schema or parent Property
- `ENUMERATES` — Concept Header → Property

## Key Concepts

### Core Nodes (8 per word-based concept)
1. Concept Header, 2. Superset, 3. JSON Schema, 4. Primary Property, 5. Properties, 6. Property Tree Graph, 7. Core Nodes Graph, 8. Concept Graph

Image-based concepts have 5 core nodes (no property tree machinery); use Image Validation Script instead of JSON Schema.

### Node Types
- **word** — JSON data, validated by JSON Schema, full 8 core nodes
- **image** — binary image file, validated by external tools (pngcheck, jpeginfo), 5 core nodes

### Tapestry Assistant (TA)
- **Pubkey:** `11f23fe40984a07be717d1628bdd0e87a2b4569f05dd7625923c20b89df93767`
- Key stored in SecureKeyStorage (AES-256-GCM encrypted, Docker volume)
- Signs events server-side by default; client signing architecture planned

### Normalization
8+ rules ensuring concept graph well-formedness. See `docs/NORMALIZATION.md`.

### BIOS
11 foundational meta-concepts (node types, supersets, sets, relationships, relationship types, properties, JSON schemas, lists, JSON data types, graph types, graphs). Created via `src/bios/run-all.js`.

## Documentation

- **Glossary:** `docs/glossary/` — 30+ canonical term definitions
- **Node Types:** `docs/node-types/` — JSON structure specs for every node type (20+ files)
- **Normalization:** `docs/NORMALIZATION.md` — the rules
- **Protocol overview:** `docs/README.md`
