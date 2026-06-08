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
3. `pnpm db:start`
4. `pnpm db:migrate`
5. `pnpm db:seed`
6. `pnpm dev`

That gets PostgreSQL running, applies the current schema, loads demo catalogue data, and starts the TanStack Start app.

Useful verification commands:

- `pnpm typecheck`
- `pnpm test`
- `pnpm db:test`

Useful database maintenance commands:

- `pnpm db:stop`
- `pnpm db:reset`
- `pnpm db:generate`
- `pnpm db:studio`

## Measurement demo

After `pnpm db:seed`, the homepage demo data includes Coins with:

- all three measurements known, such as `2001 Argentine 1 Peso`
- unknown Weight but known Diameter and Thickness, such as `1896 Argentine 20 Centavos`
- unknown Diameter but known Weight and Thickness, such as `1822 Buenos Aires Decimo`
- unknown Thickness but known Weight and Diameter, such as `1793 Flowing Hair Cent`

Homepage measurement filters use grams for Weight, millimeters for Diameter, and millimeters for Thickness. The public URL search parameters are `minWeight`, `maxWeight`, `minDiameter`, `maxDiameter`, `minThickness`, and `maxThickness`.

Measurement filters compose with each other and with the other homepage filters using AND semantics. Coins with unknown values are excluded only for the specific measurement being filtered. For example, a Weight filter excludes Coins with unknown Weight but still allows unknown Diameter or Thickness.

The seeded demo data is arranged so local manual checks are easy:

- `minWeight=6&maxWeight=7` matches `2001 Argentine 1 Peso` and `1794 Flowing Hair Half Cent`
- `minDiameter=23&maxDiameter=24` matches `2001 Argentine 1 Peso` and `1794 Flowing Hair Half Cent`
- `minThickness=1.9&maxThickness=2.1` matches `2001 Argentine 1 Peso` and `1992 Argentine 50 Centavos`
- combining all three ranges narrows the result to `2001 Argentine 1 Peso`

## Composition demo

After `pnpm db:seed`, every demo Coin has an explicit reusable Composition, and the homepage visibly shows that Composition while keeping the raw JSON block for debugging.

- shared seeded Compositions include `Silver (.900)`, `Copper`, `Copper-nickel`, and `Copper-nickel clad`
- seeded Coins intentionally reuse those Compositions across multiple records rather than embedding free-text material labels per Coin
- deleting a Composition that is still referenced by a Coin is rejected by the database

## Face Value and Currency demo

After `pnpm db:seed`, every demo Coin also has a required Face Value with a reusable Currency, and the homepage supports exact Currency plus numeric Face Value range filtering.

- shared seeded Currencies include `Euro`, `Argentine peso`, `Real`, and `United States dollar`
- the demo data includes `2003 Spain 2 Euro` with Face Value text `2 Euros`
- homepage Currency URLs use the stable Currency Code in `currency`
- homepage Face Value range URLs use `minValue` and `maxValue`
- Currency and Face Value filters compose with the existing homepage filters using AND semantics

The seeded demo data supports quick manual checks:

- `currency=euro` matches the Spain Euro example only
- `minValue=0.5&maxValue=1` matches subunit and one-unit Coins by stored major-unit numeric values
- `currency=argentine-peso&minValue=0.2&maxValue=1` narrows the results to Argentine peso denominations in that numeric range

## Where to go next

- [Catalogue glossary](/CONTEXT.md)
- [Database architecture](/packages/db/README.md)
- [Testing strategy](/docs/testing.md)
- [Architectural decision records](/docs/adr)

## Maintainer notes

Applications should consume shared database behavior from `@workspace/db` rather than duplicating schema ownership or database query logic in app code.

Database architecture stays in [`packages/db/README.md`](/packages/db/README.md). This root README intentionally keeps database detail to a pointer so the database package remains the single maintainer-facing source for schema workflow, current invariants, and operational database commands.
