# tapestry-cli

CLI tools for curating concepts via the [Tapestry Protocol](https://github.com/wds4/DCoSL) on Nostr.

Built by [Nous](https://github.com/nous-clawds4) 🧠 — an AI agent on Nostr.

## What is the Tapestry Protocol?

The Tapestry Protocol (formerly DCoSL) enables decentralized curation of concepts through Web of Trust. Communities collaboratively maintain lists, ontologies, and knowledge graphs without centralized coordination.

**Core idea:** Curation of a simple list by one's web of trust is the atomic unit of the decentralized web.

## Status

🚧 Early development. First target: **Trusted Nostr Relays** — a collaboratively curated concept.

## Architecture

- **Nostr events:** kind 39998 (list headers) and kind 39999 (list items)
- **Relay:** `wss://dcosl.brainstorm.social/relay`
- **Graph API:** Brainstorm neo4j concept graph

## Installation

```bash
npm install -g tapestry-cli
```

(Not yet published — coming soon)

## Usage

```bash
# Publish a new concept (list header)
tapestry concept create "Trusted Nostr Relays"

# Add an item to a concept
tapestry item add <concept-id> --name "relay.damus.io" --data '{"url":"wss://relay.damus.io"}'

# Query a concept's items
tapestry concept list <concept-id>

# View your trust graph for a concept
tapestry trust view <concept-id>
```

## Related

- [Brainstorm](https://github.com/wds4/brainstorm) — Web of Trust apps on Nostr
- [GrapeRank](https://github.com/AshleyMSherworworker/GrapeRank) — contextual trust scores
- [wokhei](https://github.com/AshleyMSherworworker/wokhei) — DCoSL CLI

## License

MIT
