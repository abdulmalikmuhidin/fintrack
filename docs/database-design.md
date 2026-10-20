# Database design

MongoDB collections use Mongoose schemas with timestamp fields. All financial documents
carry an ObjectId `userId`; account references are stored as `accountId`.

## Collections

### users

- `name`: trimmed string, maximum 100 characters.
- `email`: trimmed and lowercased, unique.
- `passwordHash`: bcrypt hash, excluded from normal query selection.
- `createdAt`, `updatedAt`: Mongoose timestamps.

### accounts

- `userId`, `name`, `type`, `currency`, `transactionCount`.
- Types are `checking`, `savings`, `cash`, `other`.
- Currency is a three-letter uppercase code accepted as ISO 4217 format.
- `transactionCount` supports coordinated account delete and transaction changes.
- Index: `{ userId: 1, createdAt: -1 }`.

### transactions

- `userId`, `accountId`, `type`, `amountMinor`, `currency`, `category`,
  `description`, `date`, and timestamps.
- `type` is `income` or `expense`.
- `amountMinor` is a positive integer bounded to 100,000,000,000.
- The transaction snapshots the account currency at creation; changing account currency
  does not reinterpret historical records.
- Indexes:
  - `{ userId: 1, date: -1, _id: -1 }`
  - `{ userId: 1, accountId: 1, date: -1, _id: -1 }`
  - `{ userId: 1, category: 1, date: -1 }`
  - `{ userId: 1, type: 1, date: -1, category: 1 }`

## Ownership and consistency

Every financial read/write query includes the authenticated `userId`. Transaction
create/update verifies the referenced account belongs to that user. Account deletion
returns `409 Conflict` while associated transactions exist. Finance writes use MongoDB
transactions and update `transactionCount` so concurrent creates/deletes are coordinated.
This requires a replica set or compatible MongoDB deployment.

Dashboard pipelines match the verified user ID. Recent transaction account names are joined
with both the account ID and owner ID. Summary output groups all monetary results by
currency; no FX conversion is implemented.
