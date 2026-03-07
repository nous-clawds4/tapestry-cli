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

This is the JSON Schema node for the concept of `foo bars`.

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
        "name": "",
        "title": "",
        "$schema": "http://json-schema.org/schema",
        "definitions": {},
        "type": "object",
        "required": [
            "fooBar"
        ],
        "properties": {
            "fooBar": {
                "type": "object",
                "name": "",
                "title": "",
                "slug": "",
                "alias": "",
                "description": "",
                "required": [

                ],
                "unique": [

                ],
                "properties": {
                }
            }
        }
    }
}
```
