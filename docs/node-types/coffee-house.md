Coffee House
=====

## Example of a Coffee House

- `Metropolis Coffee Company` is an example of a `coffee house`
  
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
        "slug": "json-schema-for-the-concept-of-coffee-houses",
        "title": "JSON Schema for the concept of Coffee Houses",
        "name": "JSON Schema for the concept of coffee houses",
        "description": "This is the JSON Schema for elements of the concept of coffee houses. Every element of this concept must validate against this JSON schema.",
        "wordTypes": [
            "word",
            "jsonSchema"
        ]
    },
    "jsonSchema": {
        "name": "coffee house",
        "title": "Coffee House",
        "$schema": "http://json-schema.org/schema",
        "type": "object",
        "required": [
            "coffeeHouse"
        ],
        "definitions": {},
        "properties": {
            "coffeeHouse": {
                "type": "object",
                "name": "coffee house",
                "title": "Coffee House",
                "slug": "coffee-house",
                "description": "data about this coffee house",
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
                    "description": "the slug for the coffee house"
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
                    "description": "The address of the coffee house.",
                    "properties": {
                    }
                  }
                }
            }
        }
    }
}
```
