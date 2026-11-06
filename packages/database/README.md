# @businessos/database

Prisma 7 schema, migrations and the shared database client.

- Schema: `prisma/schema.prisma`
- Config: `prisma.config.ts` (reads `DATABASE_URL` from the repository root `.env`)
- Generated client: `src/generated/prisma` (not committed, created by `pnpm generate`)

Conventions: tables are plural snake_case (`@@map`), columns are snake_case (`@map`), ids are UUIDv7, money is stored as integer poisha.

## Seeding

`pnpm --filter @businessos/database seed` creates the single developer account from `DEVELOPER_PHONE` in the root `.env`. It does nothing if a developer already exists.
