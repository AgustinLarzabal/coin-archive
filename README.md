# Coin Archive

Coin Archive is a catalog of physical coins from across history. It catalogs coin types and issues rather than individual owned specimens, and it uses the glossary in [`CONTEXT.md`](/home/agent/workspace/CONTEXT.md) as the canonical source for catalogue language such as Coin, Issuer, Ruler, Catalogue, and Catalogue Reference.

Use this README as the repository entry point. It explains the workspace at a useful maintainer level, gives the shortest path to a running local setup, and points to the deeper documents that own glossary, database architecture, testing strategy, and architectural decisions.

## Repository map

```text
.
|-- apps/
|   `-- web/          TanStack Start app for browsing the catalogue
|-- packages/
|   |-- db/           PostgreSQL + Drizzle schema, migrations, seed logic, queries, and DB tests
|   `-- ui/           Shared UI components, hooks, and styles
|-- docs/
|   |-- adr/          Architectural decision records
|   `-- testing.md    Testing strategy and verification boundaries
|-- CONTEXT.md        Canonical catalogue glossary
`-- README.md         Repository entry point
```

## Workspace layout

- `apps/web`: the application surface. It owns routes, loaders, and rendering for browsing Coin Archive data.
- `packages/db`: the shared database boundary. It owns PostgreSQL schema, Drizzle migrations, seed logic, client setup, reusable queries, and database-focused tests.
- `packages/ui`: shared UI primitives, exported components, hooks, and global styles used by app surfaces.
- `docs/testing.md`: the current testing strategy, feedback-loop split, and verification expectations.
- `docs/adr`: durable architectural decisions, including the database package boundary and testing tool choices.
- `CONTEXT.md`: the catalogue glossary. Use it before changing domain terms or inferring data model meaning.

## Quick start

Prerequisites:

- Node.js 20 or newer
- `pnpm`
- Docker

From the repository root:

1. `pnpm install`
2. `cp .env.example .env`
3. `npm run db:start`
4. `npm run db:migrate`
5. `npm run db:seed`
6. `npm run dev`

That gets PostgreSQL running, applies the current schema, loads demo catalogue data, and starts the TanStack Start app.

Useful verification commands:

- `npm run typecheck`
- `npm run test`
- `npm run db:test`

Useful database maintenance commands:

- `npm run db:stop`
- `npm run db:reset`
- `npm run db:generate`
- `npm run db:studio`

## Where to go next

- [Catalogue glossary](/home/agent/workspace/CONTEXT.md)
- [Database architecture](/home/agent/workspace/packages/db/README.md)
- [Testing strategy](/home/agent/workspace/docs/testing.md)
- [Architectural decision records](/home/agent/workspace/docs/adr)

## Maintainer notes

Applications should consume shared database behavior from `@workspace/db` rather than duplicating schema ownership or database query logic in app code.

Database architecture stays in [`packages/db/README.md`](/home/agent/workspace/packages/db/README.md). This root README intentionally keeps database detail to a pointer so the database package remains the single maintainer-facing source for schema workflow, current invariants, and operational database commands.
