# Coin Archive

Coin Archive is a catalog of physical coins from across history. It catalogs coin types and issues rather than individual owned specimens, and it uses the glossary in [`CONTEXT.md`](/CONTEXT.md) as the canonical source for catalogue language such as Coin, Issuer, Composition, Ruler, Catalogue, and Catalogue Reference.

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
3. `ln -s ../../.env apps/web/.env`
4. `pnpm db:start`
5. `pnpm db:migrate`
6. `pnpm db:seed`
7. `pnpm dev`

That gets PostgreSQL running, applies the current schema, loads demo catalogue data, and starts the TanStack Start app.

The root `.env` configures database commands. The `apps/web/.env` symlink makes the
same settings available to the Cloudflare Worker used by the web app in local
development. It is ignored by Git and only needs to be created once per clone.

Useful verification commands:

- `pnpm typecheck`
- `pnpm test`
- `pnpm db:test`

Useful database maintenance commands:

- `pnpm db:stop`
- `pnpm db:reset`
- `pnpm db:generate`
- `pnpm db:studio`

For the current demo catalogue, resetting and reseeding local data is an acceptable workflow when schema or seed content changes: `pnpm db:reset`, `pnpm db:start`, `pnpm db:migrate`, then `pnpm db:seed`.

## Homepage filter demo

The homepage currently ships five exact-match filters:

- `issuer`
- `distribution`
- `engraver`
- `ruler`
- `theme`

These are the only homepage URL search parameters currently accepted by the app search schema, the home filter UI, and the `getCoins` query contract.

After `pnpm db:seed`, the seeded demo data supports quick manual checks:

- `issuer=spain` matches `Spain 2 Euro`
- `distribution=standard-circulation` matches the standard circulation examples in the demo catalogue
- `engraver=mariano-benlliure` matches `Spain 2 Euro`
- `ruler=charles-iii` matches the seeded Charles III examples
- `theme=map` matches `Spain 2 Euro`

The supported homepage filters compose with each other using AND semantics. For example, `issuer=spain&theme=map` keeps the Spain Euro example only.

Other catalogue dimensions in [`CONTEXT.md`](/CONTEXT.md), such as measurement, mint, orientation, currency, and numeric face value, are real domain concepts but are not currently shipped as homepage filters. Keep the root README aligned with the app contract; use [`packages/db/README.md`](/packages/db/README.md) and the glossary for deeper domain and schema context.

## Composition demo

After `pnpm db:seed`, every demo Coin has an explicit reusable Composition, and the homepage visibly shows that Composition while keeping the raw JSON block for debugging.

- shared seeded Compositions include `Silver (.900)`, `Copper`, `Copper-nickel`, and `Copper-nickel clad`
- seeded Coins reuse those broad Compositions across multiple records
- at least two Bimetallic Coins demonstrate distinct Coin-owned Composition Descriptions for their specific ring and core materials
- deleting a Composition that is still referenced by a Coin is rejected by the database

## Theme demo

After `pnpm db:seed`, the demo catalogue includes reusable Themes, the homepage supports exact Theme filtering through the singular `theme` URL parameter, and Coin cards show a visible `Themes:` row when a Coin has one or more Theme Attributions.

- shared seeded Themes include `Map`, `Flag`, `Portrait`, `Animal`, `Building`, `Plant`, and `Independence`
- the demo data includes `Spain 2 Euro` with `Building` and `Map`
- the demo data includes `United States National Park Quarter` with `Animal` and `Plant`
- the demo data keeps `Argentina Copper Peso` unthemed so optional Theme behavior remains visible
- the homepage keeps the debug JSON block for manual verification, and each Coin record includes `themes`
- Theme filters compose with the other homepage filters using AND semantics

The seeded demo data supports quick manual checks:

- `theme=map` matches `Spain 2 Euro`, shows `Themes: Building, Map`, and includes `themes` in that Coin's debug JSON
- `theme=animal` matches `United States National Park Quarter`
- `theme=portrait` matches `Argentina Sol de Mayo Peso`
- `theme=building&issuer=spain` keeps the Spain Euro example only
- `theme=MAP` behaves the same as `theme=map`

Seed data is for local exploration and manual verification only. Automated behavior tests should use purpose-built fixtures instead of depending on seeded titles or seeded IDs.

## Where to go next

- [Catalogue glossary](/CONTEXT.md)
- [Database architecture](/packages/db/README.md)
- [Testing strategy](/docs/testing.md)
- [Architectural decision records](/docs/adr)

## Maintainer notes

Applications should consume shared database behavior from `@coin-archive/db` rather than duplicating schema ownership or database query logic in app code.

Database architecture stays in [`packages/db/README.md`](/packages/db/README.md). This root README intentionally keeps database detail to a pointer so the database package remains the single maintainer-facing source for schema workflow, current invariants, and operational database commands.
