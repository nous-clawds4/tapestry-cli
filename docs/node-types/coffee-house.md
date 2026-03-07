Coffee House
=====

## Example of a Coffee House

- the `foo bar` for the concept of `coffee houses`

```json
{
  "word": {
    "slug": "coffee-house--metropolis-coffee-company",
    "name": "coffee house: Metropolis Coffee Company",
    "title": "Coffee House: Metropolis Coffee Company",
    "wordTypes": ["word", "coffeeHouse"]
  },
  "coffeeHouse": {
    "slug": "metropolis-coffee-company",
    "name": "Metropolis Coffee Company",
    "address": {
      "street": "123 Main Street",
      "city": "Metropolis",
      "state": "New York",
      "zip": 12345
    },
    "hours": {
    }
  }
}
```

## JSON Schema node

This is the JSON Schema node for the concept of `coffee houses`.

The above file should validate against the JSON schema within the file below (within `jsonSchema`).

```json
{
    "word": {
        "slug": "json-schema-for-the-concept-of-foo-bar",
        "title": "JSON Schema for the concept of Foo Bars",
        "name": "JSON Schema for the concept of foo bars",
        "description": "This is the JSON Schema for elements of the concept of foo bars. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ],
    },
    "jsonSchema": {
        "name": "coffee house",
        "title": "Coffee House",
        "$schema": "http://json-schema.org/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "coffeeHouse"
        ],
        "properties": {
            "coffeeHouse": {
                "type": "object",
                "name": "",
                "title": "",
                "slug": "",
                "alias": "",
                "description": "",
                "required": [
                  "slug"
                ],
                "unique": [
                  "slug"
                ],
                "properties": {
                  "slug": {
                    "type": "string",
                    "name": "slug",
                    "slug": "slug",
                    "title": "Slug",
                    "comments": "The tapestry protocol requires that the slug of a word must be unique within any given concept graph. By convention, this may be accomplished via concatenation of the slug of the principal parent concept (which must be unique within any given concept graph) and the parentConcept.slug of the word, e.g. coffeeHouse.slug, which must be unique within that concept."
                  },
                  "name": {
                    "type": "string",
                    "name": "name",
                    "slug": "name",
                    "title": "Name",
                    "description": "The name of the coffee house."
                  },
                  "address": {
                    "type": "object",
                    "name": "address",
                    "slug": "address",
                    "title": "Address",
                    "description": "The name of the coffee house.",
                    "properties": {
                    }
                  }
                }
            }
        }
    }
}
```
