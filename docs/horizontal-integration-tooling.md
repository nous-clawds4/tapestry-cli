Horizontal Integration Tooling: Next Steps
=====

Tooling for building and synchronizing JSON Schemas and property trees, including cross-concept integration via `definitions` and `$ref`.

## Done

### Schema-first workflow

- [x] **Save JSON Schema** — CLI: `tapestry concept schema <name> --content '<json>'` / Front end: Concepts › Detail › JSON Schema (visual editor) / Endpoint: `POST /api/normalize/save-schema`
- [x] **View JSON Schema** — CLI: `tapestry concept schema <name>` / Front end: visual display
- [x] **Generate property tree from schema** — CLI: `tapestry property generate-tree <concept>` / Endpoint: `POST /api/normalize/generate-property-tree` (from-scratch only)
- [x] **Pre-populated initial schema** — `create-concept` now writes the primary property structure (with 3 default sub-properties) into `jsonSchema` at creation time

### Property-tree-first workflow

- [x] **Create individual property** — CLI: `tapestry property create <name> --concept <concept> [--parent <uuid>] [--type string] [--description "..."] [--required]` / Endpoint: `POST /api/normalize/create-property`
- [x] **View property tree** — Front end: Concepts › Detail › Properties (read-only table)
- [x] **Generate JSON Schema from property tree** — CLI: `tapestry property generate-json-schema <concept>` / Endpoint: `POST /api/property/generate-json-schema`

### Infrastructure

- [x] **Word-wrapper format** — All endpoints that read/write the JSON Schema node's `json` tag use the `{word: {...}, jsonSchema: {...}}` format. Legacy flat schemas are auto-migrated on read.
- [x] **`definitions` field** — Present in every new JSON Schema (empty `{}` by default), reserved for cross-concept `$ref` integration.

## To Do

### Incremental sync

- [ ] **Incremental property tree update from schema** — `generate-property-tree` only works from scratch (errors if properties already exist). Need a way to diff a modified schema against the existing tree and add/remove/update properties incrementally.
- [ ] **Incremental JSON Schema update from property tree** — `generate-json-schema` rebuilds the whole schema. Need incremental update when a single property is added/modified.
- [ ] **Schema ↔ property tree sync status** — Detect when they're out of sync (e.g., schema edited but tree not regenerated, or vice versa). Could be a health audit check and/or a UI indicator.

### Front-end property editing

- [ ] **Create property from UI** — Button/form on the Properties tab to add a new property (top-level or nested)
- [ ] **Edit property from UI** — Inline editing of property type, description, required status
- [ ] **Delete property from UI** — Remove a property and unwire it from the tree
- [ ] **Reorder properties** — Change property order within a level
- [ ] **Generate tree / rebuild schema buttons** — UI buttons on Properties and JSON Schema tabs to trigger `generate-property-tree` and `generate-json-schema`

### Cross-concept integration (`definitions` / `$ref`)

- [ ] **Import concept schema into definitions** — Given concept A (e.g., coffee house) and concept B (e.g., address), import B's schema into A's `definitions` section and wire the relevant property to use `$ref: "#/definitions/address"`
- [ ] **CLI command** — e.g., `tapestry concept import-schema <source-concept> --into <target-concept> --as <property-name>`
- [ ] **Front-end UI** — Concept picker on the Properties tab for linking a property to an existing concept's schema
- [ ] **ENUMERATES integration** — When a property `ENUMERATES` a concept (e.g., `type` enumerates `JSON data types`), auto-populate the property's `enum` array from that concept's elements and wire `$ref` in definitions
- [ ] **Cascade updates** — When a source concept's schema changes, propagate to all concepts that reference it via definitions

### Validation

- [ ] **Validate elements against schema** — CLI: `tapestry audit schemas <concept>` / Endpoint / Front-end indicator — check that all elements of a concept validate against its current JSON Schema
- [ ] **Validate on element creation** — `create-element` should optionally validate the provided JSON against the schema before publishing
