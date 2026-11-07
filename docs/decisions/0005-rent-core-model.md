# 0005. Rent core data model

Date: 2026-11-07
Status: accepted

## Decision

- Organization has businesses, a business has properties, a property has units. A unit is a flat or a shop.
- Money is stored as whole poisha (৳ 18,500 is 1850000).
- A unit can have only one lease that is not finished (draft, sent, signed or active). Ended leases stay as history. The database enforces this with a partial unique index.
- A lease has `salami` (used for shops) and `advance_deposit` (used for flats), the monthly rent, a due day from 1 to 28, and signing times for the renter and the owner.
- A renter is one record per person per organization, unique by phone, and is linked to a login user when the first lease is sent for signing.
- Only flats have bedrooms and bathrooms.
- The seed creates the developer account, one INTERNAL organization with the developer as owner, one rental business and one property.

## Consequences

NID numbers are stored as plain text for now and must be protected (encryption at rest and access logging) before launch. A manager is limited to one membership per organization, optionally for one business.
