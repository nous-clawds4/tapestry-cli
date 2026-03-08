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
    "wordTypes": ["word", "coffeeHouse"],
    "coreMemberOf": [ {"slug": "concept-header-for-the-concept-of-coffee-houses", "uuid": "<uuid>"} ]
  },
  "coffeeHouse": {
    "slug": "metropolis-coffee-company",
    "name": "Metropolis Coffee Company",
    "description": "A beloved Chicago roaster and café known for single-origin pour-overs and a cozy Andersonville atmosphere.",
    "address": {
      "street": "1039 W Granville Ave",
      "city": "Chicago",
      "state": "Illinois",
      "zip": "60660"
    },
    "hours": {
      "monday": "7:00 AM – 7:00 PM",
      "tuesday": "7:00 AM – 7:00 PM",
      "wednesday": "7:00 AM – 7:00 PM",
      "thursday": "7:00 AM – 7:00 PM",
      "friday": "7:00 AM – 7:00 PM",
      "saturday": "8:00 AM – 7:00 PM",
      "sunday": "8:00 AM – 6:00 PM"
    },
    "website": "https://www.metropoliscoffee.com",
    "ropiRating": 4.6
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
        ],
        "coreMemberOf": [
            {
                "slug": "concept-header-for-the-concept-of-coffee-houses",
                "uuid": "<uuid>"
            }
        ]
    },
    "jsonSchema": {
        "name": "coffee house",
        "title": "Coffee House",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
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
                  "slug",
                  "name"
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
                    "description": "A unique kebab-case identifier for this coffee house"
                  },
                  "name": {
                    "type": "string",
                    "name": "name",
                    "slug": "name",
                    "title": "Name",
                    "description": "The name of the coffee house"
                  },
                  "description": {
                    "type": "string",
                    "name": "description",
                    "slug": "description",
                    "title": "Description",
                    "description": "A brief description of the coffee house"
                  },
                  "address": {
                    "type": "object",
                    "name": "address",
                    "slug": "address",
                    "title": "Address",
                    "description": "The physical address of the coffee house",
                    "properties": {
                      "street": {
                        "type": "string",
                        "name": "street",
                        "title": "Street",
                        "description": "Street address"
                      },
                      "city": {
                        "type": "string",
                        "name": "city",
                        "title": "City",
                        "description": "City name"
                      },
                      "state": {
                        "type": "string",
                        "name": "state",
                        "title": "State",
                        "description": "State or province"
                      },
                      "zip": {
                        "type": "string",
                        "name": "zip",
                        "title": "ZIP Code",
                        "description": "Postal / ZIP code"
                      }
                    }
                  },
                  "hours": {
                    "type": "object",
                    "name": "hours",
                    "slug": "hours",
                    "title": "Hours",
                    "description": "Weekly operating hours",
                    "properties": {
                      "monday": { "type": "string", "name": "monday", "title": "Monday" },
                      "tuesday": { "type": "string", "name": "tuesday", "title": "Tuesday" },
                      "wednesday": { "type": "string", "name": "wednesday", "title": "Wednesday" },
                      "thursday": { "type": "string", "name": "thursday", "title": "Thursday" },
                      "friday": { "type": "string", "name": "friday", "title": "Friday" },
                      "saturday": { "type": "string", "name": "saturday", "title": "Saturday" },
                      "sunday": { "type": "string", "name": "sunday", "title": "Sunday" }
                    }
                  },
                  "website": {
                    "type": "string",
                    "name": "website",
                    "slug": "website",
                    "title": "Website",
                    "description": "The website URL for this coffee house"
                  },
                  "ropiRating": {
                    "type": "number",
                    "name": "ropiRating",
                    "slug": "ropi-rating",
                    "title": "ROPI Rating",
                    "description": "A numeric rating for this coffee house"
                  }
                }
            }
        }
    }
}
```
