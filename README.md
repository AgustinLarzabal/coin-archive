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

For the current demo catalogue, resetting and reseeding local data is an acceptable workflow when schema or seed content changes: `pnpm db:reset`, `pnpm db:start`, `pnpm db:migrate`, then `pnpm db:seed`.

## Measurement demo

After `pnpm db:seed`, the homepage demo data includes Coins with:

- all three measurements known, such as `Argentina Convertible Peso`
- only Diameter known, such as `Argentina Copper Peso`
- Weight and Diameter known but unknown Thickness, such as `United States Lincoln Cent`

Homepage measurement filters use grams for Weight, millimeters for Diameter, and millimeters for Thickness. The public URL search parameters are `minWeight`, `maxWeight`, `minDiameter`, `maxDiameter`, `minThickness`, and `maxThickness`.

Measurement filters compose with each other and with the other homepage filters using AND semantics. Coins with unknown values are excluded only for the specific measurement being filtered. For example, a Weight filter excludes Coins with unknown Weight but still allows unknown Diameter or Thickness.

The seeded demo data is arranged so local manual checks are easy:

- `minWeight=6&maxWeight=7` matches `Argentina Convertible Peso` only
- `minDiameter=23&maxDiameter=24` matches `Argentina Convertible Peso` and `Buenos Aires 5 Decimos`
- `minThickness=1.9&maxThickness=2.1` matches `Argentina Convertible Peso`, `Buenos Aires 8 Reales 1813`, and `United States National Park Quarter`
- combining all three ranges narrows the result to `Argentina Convertible Peso`

## Composition demo

After `pnpm db:seed`, every demo Coin has an explicit reusable Composition, and the homepage visibly shows that Composition while keeping the raw JSON block for debugging.

- shared seeded Compositions include `Silver (.900)`, `Copper`, `Copper-nickel`, and `Copper-nickel clad`
- seeded Coins intentionally reuse those Compositions across multiple records rather than embedding free-text material labels per Coin
- deleting a Composition that is still referenced by a Coin is rejected by the database

## Mint demo

After `pnpm db:seed`, the demo catalogue includes reusable Mints, the homepage supports exact Mint filtering through the singular `mint` URL parameter, and Coin cards show a visible `Mints:` row when a Coin has one or more Mint Attributions.

- shared seeded Mints include `Royal Mint of Madrid`, `Buenos Aires Mint`, `Philadelphia Mint`, and `Denver Mint`
- the demo data includes `Spain 2 Euro` with `Royal Mint of Madrid`
- the demo data includes `Buenos Aires 8 Reales 1813` with `Buenos Aires Mint`
- the demo data includes `United States Lincoln Cent` with `Philadelphia Mint`
- the demo data includes `United States National Park Quarter` with both `Philadelphia Mint` and `Denver Mint`
- the homepage keeps the debug JSON block for manual verification, and each Coin record includes `mints`
- Mint filters compose with the other homepage filters using AND semantics

The seeded demo data supports quick manual checks:

- `mint=royal-mint-of-madrid` matches `Spain 2 Euro`, shows `Mints: Royal Mint of Madrid`, and includes `mints` in that Coin's debug JSON
- `mint=buenos-aires-mint` matches `Buenos Aires 8 Reales 1813`
- `mint=philadelphia-mint` matches `United States Lincoln Cent` and `United States National Park Quarter`
- `mint=denver-mint` matches `United States National Park Quarter`, showing the multi-mint demo Coin
- `mint=philadelphia-mint&currency=united-states-dollar` keeps both United States Mint examples
- `mint=philadelphia-mint&composition=copper-nickel-clad` narrows the result to `United States National Park Quarter`

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
- `theme=building&currency=euro` keeps the Spain Euro example only
- `theme=MAP` behaves the same as `theme=map`

## Face Value and Currency demo

After `pnpm db:seed`, every demo Coin also has a required Face Value with a reusable Currency, and the homepage supports exact Currency plus numeric Face Value range filtering.

- shared seeded Currencies include `Euro`, `Argentine peso`, `Real`, and `United States dollar`
- the demo data includes `Spain 2 Euro` with Face Value text `2 Euros`, numeric value `2`, Currency `Euro`, and Issue Year Range `2002-2026`
- homepage Currency URLs use the stable Currency Code in `currency`
- homepage Face Value range URLs use `minValue` and `maxValue`
- Currency and Face Value filters compose with the existing homepage filters using AND semantics

The seeded demo data supports quick manual checks:

- `currency=euro` matches the Spain Euro example only
- `minValue=0.5&maxValue=1` matches `Buenos Aires 5 Decimos`, `Buenos Aires Transition Half Real`, `Argentina Sol de Mayo Peso`, `Argentina Copper Peso`, `Argentina Convertible Peso`, and `United States Flowing Hair Dollar`
- `currency=argentine-peso&minValue=0.2&maxValue=1` narrows the results to Argentine peso denominations in that numeric range

Seed data is for local exploration and manual verification only. Automated behavior tests should use purpose-built fixtures instead of depending on seeded titles or seeded IDs.

## Where to go next

- [Catalogue glossary](/CONTEXT.md)
- [Database architecture](/packages/db/README.md)
- [Testing strategy](/docs/testing.md)
- [Architectural decision records](/docs/adr)

## Maintainer notes

Applications should consume shared database behavior from `@workspace/db` rather than duplicating schema ownership or database query logic in app code.

Database architecture stays in [`packages/db/README.md`](/packages/db/README.md). This root README intentionally keeps database detail to a pointer so the database package remains the single maintainer-facing source for schema workflow, current invariants, and operational database commands.
