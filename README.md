# Coin Archive

Coin Archive is a catalog of physical coins from across history. This repository contains the web application, the shared database package, and the maintainer documentation that define the current catalogue workflow.

Use this README as the entry point. It links to the glossary, database architecture, testing strategy, and ADRs instead of duplicating their deeper detail.

## Workspace layout

- `apps/web`: TanStack Start web app for browsing Coin Archive data
- `packages/db`: shared PostgreSQL and Drizzle package that owns schema, migrations, seed logic, client setup, tests, and shared queries
- `packages/ui`: shared UI components and styles
- `docs/testing.md`: testing strategy and verification boundaries
- `docs/adr`: architectural decision records
- `CONTEXT.md`: canonical catalogue glossary and domain language

## Quick start

Prerequisites:

- Node.js 20 or newer
- `pnpm`
- Docker for the local PostgreSQL service

Setup:

1. `pnpm install`
2. Copy `.env.example` to `.env` and review the local database URLs
3. `npm run db:start`
4. `npm run db:migrate`
5. `npm run db:seed`
6. `npm run dev`

Useful verification commands:

- `npm run typecheck`
- `npm run test`
- `npm run db:test`

## Read next

- [Catalogue glossary](/home/agent/workspace/CONTEXT.md)
- [Database architecture](/home/agent/workspace/packages/db/README.md)
- [Testing strategy](/home/agent/workspace/docs/testing.md)
- [Architectural decision records](/home/agent/workspace/docs/adr)

## Notes for maintainers

- Applications should consume shared database behavior from `@workspace/db` rather than owning schema details directly.
- Database architecture, schema workflow, and operational database commands are documented in [`packages/db/README.md`](/home/agent/workspace/packages/db/README.md).
- ADRs explain durable architectural choices such as the PostgreSQL and Drizzle package boundary and the current testing approach.
