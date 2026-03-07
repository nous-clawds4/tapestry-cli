JSON Schema
=====

Any given `element` (e.g., a specific coffee house) of a `concept` (e.g., a specific coffee house) must validate against the JSON schema of that concept.

## Sample JSON (as a core member node for the coffee house concept)

```json
{
  "word": {
    "slug": "json-schema-for-the-concept-of-coffee-houses",
    "name": "JSON schema for the concept of coffee houses",
    "description": "the json schema for the concept of coffee houses",
    "wordTypes": ["word", "jsonSchema"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "jsonSchema": {
    
  }
}
```
