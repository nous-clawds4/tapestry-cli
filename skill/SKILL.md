# Tapestry Skill

Interact with a running Tapestry/Brainstorm instance — a concept graph built on Nostr and Neo4j using the Tapestry Protocol (formerly DCoSL).

## What is Tapestry?

The Tapestry Protocol enables **decentralized curation of concepts** via Nostr. Users publish list headers (kind 39998) and list items (kind 39999) that define concepts, their properties, relationships, and elements. These events are synced to a local strfry relay and imported into a Neo4j concept graph for querying.

Key ideas:
- **Concept = List Header** (kind 39998): defines a category (e.g., "US President", "nostr relay")
- **Item = List Item** (kind 39999): an instance of a concept (e.g., "George Washington", "relay.damus.io")
- **Web of Trust**: GrapeRank scores determine whose contributions are trusted
- **Loose consensus**: overlapping WoTs produce shared concept lists without centralization

## Prerequisites

- Docker stack running: `docker compose ps` in the tapestry repo
- Services: strfry (relay), Neo4j (concept graph), Brainstorm (web app + API)
- All accessible at `http://localhost:8080`

## CLI: tapestry

Installed globally via `npm link` from `~/.openclaw/workspace/tapestry-cli`.

### Commands

#### `tapestry status`
Show health of all services.

```bash
tapestry status
```

Output includes: Neo4j (running, user count, relationships), strfry (service status, event count), Network, Ranking (GrapeRank/PageRank), Lists (whitelist/blacklist).

#### `tapestry query <cypher>`
Run any Cypher query against the Neo4j concept graph.

```bash
# List all concepts
tapestry query "MATCH (h:ListHeader)-[:HAS_TAG]->(t:NostrEventTag {type: 'names'}) RETURN t.value AS concept ORDER BY concept"

# Count nodes by label
tapestry query "MATCH (n) RETURN labels(n) AS label, count(n) AS cnt ORDER BY cnt DESC"

# Show concept items with their parent concept
tapestry query "MATCH (h:ListHeader)-[:HAS_TAG]->(ht:NostrEventTag {type: 'names'}), (i:ListItem)-[:HAS_TAG]->(it:NostrEventTag {type: 'name'}), (i)-[:HAS_TAG]->(z:NostrEventTag {type: 'z'}), (h)-[:HAS_TAG]->(a:NostrEventTag {type: 'a'}) WHERE z.value = a.value RETURN ht.value AS concept, it.value AS item LIMIT 20"

# Show users
tapestry query "MATCH (u:NostrUser) RETURN u.pubkey AS pubkey LIMIT 10"

# Raw JSON output
tapestry query --raw "MATCH (n) RETURN count(n) AS total"
```

**⚠️ Quoting:** Use single quotes for string values inside Cypher. Double quotes get consumed by the shell. Example: `{type: 'names'}` not `{type: "names"}`.

### Neo4j Schema

**Node labels:**
- `NostrEvent` — base label for all imported nostr events
- `ListHeader` — kind 39998 concept definitions (also has `NostrEvent`)
- `ListItem` — kind 39999 concept instances (also has `NostrEvent`)
- `Superset` — items that are supersets of other concepts
- `Property` — items defining properties of concepts
- `Relationship` — items defining relationship types between concepts
- `JSONSchema` — items defining JSON schemas for concepts
- `NostrUser` — pubkeys that authored events
- `NostrEventTag` — individual tags from events

**NostrEventTag properties:**
- `type` — tag name (first element, e.g., "names", "name", "d", "a", "z", "p", "e")
- `value` — tag value (second element)
- `value1` — third element (e.g., plural name for "names" tags)
- `value2`, `value3`, `value4` — additional elements if present
- `uuid` — unique id: `{last8chars_of_eventId}_{type}`

**Key tag types:**
- `names` — on ListHeaders: `value` = singular name, `value1` = plural name
- `name` — on ListItems: `value` = item name
- `d` — NIP-33 identifier (d-tag)
- `a` — addressable event reference (on ListHeaders: identifies the concept)
- `z` — parent pointer (on ListItems: points to parent ListHeader's `a` tag)
- `p` — pubkey reference
- `e` — event id reference

**Relationships:**
- `(:NostrUser)-[:AUTHORS]->(:NostrEvent)` — who published what
- `(:NostrEvent)-[:HAS_TAG]->(:NostrEventTag)` — event's tags
- `(:NostrEventTag)-[:REFERENCES]->(:NostrUser)` — p-tag references
- `(:NostrEventTag)-[:REFERENCES]->(:NostrEvent)` — e-tag references

**Concept-level relationships** (created by label pipeline):
- `IS_THE_CONCEPT_FOR`, `IS_A_SUPERSET_OF`, `HAS_ELEMENT`
- `IS_A_PROPERTY_OF`, `IS_THE_JSON_SCHEMA_FOR`, `ENUMERATES`

### API Endpoints

The CLI talks to `http://localhost:8080` (configurable via `TAPESTRY_API_URL` env var).

Key read endpoints (no auth required):
- `GET /api/neo4j-status` — Neo4j health + counts
- `GET /api/strfry-status` — strfry health + event counts
- `GET /api/neo4j/run-query?cypher=<url-encoded>` — run Cypher queries
- `GET /api/instance-status` — combined status (may be slow)
- `GET /api/list-status` — whitelist/blacklist counts
- `GET /api/ranking-status` — GrapeRank/PageRank status

Key write endpoints (may require auth):
- `POST /api/batch-transfer` — ETL: strfry events → Neo4j
- `POST /api/negentropy-sync` — sync events from remote relays
- `POST /api/generate-graperank` — calculate GrapeRank scores
- `POST /api/create-and-publish-kind10040` — publish NIP-85 trusted assertions

### Data Pipeline

To refresh the concept graph from strfry:
```bash
# Inside the Docker container:
docker exec tapestry-tapestry-1 bash /usr/local/lib/node_modules/brainstorm/src/manage/concept-graph/batchTransfer.sh
```

Pipeline steps: strfry scan → processTags.js → APOC load → label nodes → create relationships.

### Common Patterns

**Find all concepts and their item counts:**
```cypher
MATCH (h:ListHeader)-[:HAS_TAG]->(ht:NostrEventTag {type: 'names'})
OPTIONAL MATCH (i:ListItem)-[:HAS_TAG]->(z:NostrEventTag {type: 'z'}),
               (h)-[:HAS_TAG]->(a:NostrEventTag {type: 'a'})
WHERE z.value = a.value
RETURN ht.value AS concept, ht.value1 AS plural, count(DISTINCT i) AS items
ORDER BY items DESC
```

**Find who contributed to a concept:**
```cypher
MATCH (u:NostrUser)-[:AUTHORS]->(i:ListItem)-[:HAS_TAG]->(z:NostrEventTag {type: 'z'}),
      (h:ListHeader)-[:HAS_TAG]->(a:NostrEventTag {type: 'a'}),
      (h)-[:HAS_TAG]->(ht:NostrEventTag {type: 'names'})
WHERE z.value = a.value AND ht.value = 'nostr relay'
RETURN u.pubkey AS contributor, count(i) AS items
```

## Repo Locations

- **tapestry-cli:** `~/.openclaw/workspace/tapestry-cli` (GitHub: nous-clawds4/tapestry-cli)
- **tapestry (brainstorm fork):** `~/.openclaw/workspace/tapestry` (concept-graph branch)
- **Docker stack:** `cd ~/.openclaw/workspace/tapestry && docker compose up -d`
