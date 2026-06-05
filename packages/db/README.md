# `@workspace/db`

This README is for maintainers and coding agents changing the database layer. It explains the current Coin Archive database architecture from the package that owns schema, migrations, seed logic, client setup, database tests, and shared queries.

Use the glossary in [`/CONTEXT.md`](/home/agent/workspace/CONTEXT.md) for canonical catalogue language and the ADRs in [`/docs/adr`](/home/agent/workspace/docs/adr) for architectural rationale. This document describes the current database package boundary and behavior; it does not restate the full glossary or ADR history.

## Package boundary

Applications should consume shared database behavior from the database package instead of owning schema details. That means:

- import the shared client, schema exports, types, and query functions from `@workspace/db`
- add reusable query behavior in `packages/db/src/queries`
- add schema and migration changes in `packages/db/src/schema` and `packages/db/migrations`
- keep application code focused on application behavior, not duplicated database ownership

## Core catalogue relationships

Start with the catalogue model, not the tables:

- Coin has exactly one direct Issuer.
- Coin may have zero or more Ruler attributions.
- Ruler Attribution Order matters only within a single Coin's ruler attributions.
- Coin may have zero or more Catalogue References.
- Issuer Grouping places a more specific Issuer under a broader Issuer for browsing and filtering.
- Ruler may belong to an optional Ruler Group.

Important model notes:

- Coin Titles are display labels and should not be parsed into structured catalogue data.
- Issuer Grouping and Ruler Group are different concepts. Issuer Grouping is parent-child browsing structure for Issuers. Ruler Group is an optional flat label attached to a Ruler.
- Catalogue References are external identifiers attached to a Coin. A Reference Number is meaningful only together with its Catalogue.
- Current schema work covers the core catalogue relationships above. Historical, geographic, minting, material, inscription, image, and broader reference information may be modeled later.

## Table mapping

The current core relationships map to these tables:

- `coin`: Coin record with `title` and required direct `issuer_id`
- `issuer`: Issuer record with optional `parent_issuer_id` for Issuer Grouping
- `ruler`: Ruler record with optional `ruler_group_id`
- `ruler_group`: optional flat grouping attached to a Ruler
- `coin_ruler`: join table from Coin to Ruler plus per-Coin `ruler_order`
- `catalogue`: external catalogue definition with display `title` and unique `code`
- `coin_reference`: Catalogue Reference attached to a Coin with `catalogue_id` and opaque `number`

## Core ER diagram

```mermaid
erDiagram
  issuer ||--o{ issuer : "parent_issuer_id"
  issuer ||--o{ coin : "issuer_id"
  coin ||--o{ coin_ruler : "coin_id"
  ruler ||--o{ coin_ruler : "ruler_id"
  ruler_group ||--o{ ruler : "ruler_group_id"
  coin ||--o{ coin_reference : "coin_id"
  catalogue ||--o{ coin_reference : "catalogue_id"
```

## Current database-enforced invariants

These are enforced by the current PostgreSQL schema and exercised by package tests:

- every Coin must have exactly one direct Issuer because `coin.issuer_id` is `NOT NULL` and references `issuer.id`
- Issuer Code, Ruler Code, and Ruler Group Code must be unique and lowercase slug-style text
- Catalogue Code is required and unique ignoring case; preferred display casing is still preserved in `catalogue.code`
- an Issuer cannot be its own direct parent
- Ruler may omit `ruler_group_id`
- Coin to Ruler attribution is unique per `(coin_id, ruler_id)`
- Ruler Attribution Order must be positive and unique per Coin through `(coin_id, ruler_order)`
- Catalogue Reference is deduplicated by `(coin_id, catalogue_id, normalized number)` where normalization trims outer whitespace, collapses internal whitespace, and compares case-insensitively
- deleting a Coin cascades to `coin_ruler` and `coin_reference`
- deleting referenced Issuers, Rulers, Ruler Groups, or Catalogues is restricted while dependent rows still exist

## Known gaps and future schema work

These are intentionally separate from the enforced invariants above:

- arbitrary Issuer Grouping cycles are not yet prevented; only self-parenting is blocked today
- the schema does not encode every future catalogue dimension yet; do not infer missing historical, geographic, minting, material, inscription, image, or broader reference structure from `coin.title`
- Coin Titles remain display labels rather than structured facts
- this README documents the current package boundary and behavior, not a promise that every future read model will keep the same shape

## Consumer usage

Consumers should import from `@workspace/db` instead of rebuilding database access locally.

- use `db` when a caller needs direct shared access
- prefer shared query functions such as `getCoins`, `getIssuers`, `getRulers`, and `getCatalogues` for reusable data access behavior
- reuse exported read types from the package when app code needs the package-owned result shape
- keep schema ownership, SQL behavior, and normalization rules in this package so apps do not drift

## Maintainer workflow

### Schema and migrations

- add or update schema modules in `packages/db/src/schema`
- generate migrations from schema changes with `npm run db:generate`
- apply migrations to the development database with `npm run db:migrate`
- commit the schema change and generated migration together

### Shared queries

- add reusable data access in `packages/db/src/queries`
- keep sorting, filtering, joins, and row-to-record mapping in this package when multiple apps or routes should share the same behavior
- add unit or integration coverage next to the query behavior it protects

### Seed data

- keep demo seed data in `packages/db/src/seed/seed-data.ts`
- keep seeding orchestration in `packages/db/src/seed/index.ts`
- treat seed data as local/demo setup, not as a dependency for behavior tests

### Database tests

- fast package tests run with `pnpm --filter @workspace/db test`
- PostgreSQL integration tests run with `npm run db:test`
- integration tests use `DATABASE_TEST_URL`, apply migrations before running, and clear known tables between tests
- PostgreSQL must already be running before database tests; if it is not, start it explicitly with `npm run db:start`

## Environment

- `DATABASE_URL`: development database used by the package client, migrations, seed command, and local database workflows
- `DATABASE_TEST_URL`: dedicated PostgreSQL database for integration tests only; test helpers reject URLs that are not clearly test-specific

See [`.env.example`](/home/agent/workspace/.env.example) for the current local variable names and example values.

## Root database commands

Run these from the repository root:

- `npm run db:start`: start the PostgreSQL service with Docker Compose
- `npm run db:stop`: stop the PostgreSQL service
- `npm run db:reset`: remove PostgreSQL containers and volumes
- `npm run db:generate`: generate Drizzle migrations from schema changes
- `npm run db:migrate`: apply migrations to `DATABASE_URL`
- `npm run db:seed`: load demo seed data into `DATABASE_URL`
- `npm run db:studio`: open Drizzle Studio
- `npm run db:test`: run PostgreSQL-backed integration tests against `DATABASE_TEST_URL`

## Package-local commands

These commands are what the root scripts delegate to inside `packages/db`:

- `pnpm --filter @workspace/db typecheck`
- `pnpm --filter @workspace/db test`
- `pnpm --filter @workspace/db run test:db`
- `pnpm --filter @workspace/db run generate`
- `pnpm --filter @workspace/db run migrate`
- `pnpm --filter @workspace/db run seed`
- `pnpm --filter @workspace/db run studio`
