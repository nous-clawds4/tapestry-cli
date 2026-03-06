# UUID

The a-tag (`kind:pubkey:d-tag`) for replaceable nostr events. Derivable from the event envelope itself. This is the true unique identifier for a node. Not stored inside the node's own JSON content (that would be circular), but *is* included when referencing other nodes (e.g., in `coreMemberOf`).

## See Also
- [Slug](./slug.md)
- [Key](./key.md)
