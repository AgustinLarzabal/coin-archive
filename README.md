# Coin Archive

Coin Archive is a digital archive of coins.

## Getting started

You need Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`, pnpm `10.33.4` through
Corepack, and Docker for local PostgreSQL and integration tests.

Install dependencies from the repository root:

```bash
pnpm install
```

Create the three local environment files and replace example-only values. Do
not commit real credentials:

```bash
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

Start and initialize the local database:

```bash
pnpm db:start
pnpm db:migrate
pnpm db:seed
```

Start the development tasks with:

```bash
pnpm dev
```

The web application runs on port 3000, the standalone API on port 3001, and the admin application on port 3002. Browsers request catalogue data through web server functions rather than connecting to the database
package directly. See [ADR 0001](docs/adr/0001-standalone-api-boundary.md)
for the boundary between client runtimes, the API, and persistence.

Explore can filter Coins by one Mint's stable, globally unique slug. A Mint is
a physical facility whose public record includes its slug, name, place, and country.
`GET /v1/mints` lists those records, and `GET /v1/coins?mint=<slug>` finds Coins
associated with one Mint. A Coin can have multiple confirmed Mints or none.

The web Worker reads the private catalogue API through its `API` service
binding. The web build does not need an API origin. `pnpm dev` continues to use
the local Node API on port 3001 for development.

To run the same local processes while the API connects to the personal Neon
Staging Database, follow the [Neon staging workflow](docs/neon-staging.md) and
use `pnpm dev:staging`.

## Manual deployment

Deploy the private API Worker before the web Worker that binds to it. Worker
startup does not apply database migrations. Run commands from the repository
root with Cloudflare credentials configured. The privacy and deployed Archive
checks require `CLOUDFLARE_ACCOUNT_ID` and an account-scoped
`CLOUDFLARE_API_TOKEN`; see the [API deployment guide](apps/api/README.md#private-worker-deployment)
for the required permissions.

### Staging

Apply new migrations with `pnpm db:migrate:staging`, using the direct Neon URL
in the root `.env.staging.local`. Do not repeat `pnpm db:seed:staging` on an
already seeded database. Then follow the [staging Worker deployment commands](apps/web/README.md#staging-verification)
to check privacy, dry-run and deploy both Workers, and verify the deployed web
app. `pnpm dev:staging` starts local processes; it does not deploy Workers.

### Production

When the release includes migrations, first set `PRODUCTION_DATABASE_URL` from
the production database's **direct** connection string in your secret manager.
Check the credential-free host and database name before applying migrations:

```bash
DATABASE_URL="$PRODUCTION_DATABASE_URL" node -e 'const url = new URL(process.env.DATABASE_URL); console.log(`${url.hostname}/${decodeURIComponent(url.pathname.slice(1))}`)'
DATABASE_URL="$PRODUCTION_DATABASE_URL" pnpm db:migrate
```

Without `DATABASE_URL`, `pnpm db:migrate` targets the local database. Deploy the
production Workers after migrations:

```bash
pnpm --filter api deploy:worker
pnpm --filter web build
pnpm --filter web exec wrangler deploy --dry-run
pnpm --filter web exec wrangler deploy
```

Confirm the web dry run targets `coin-archive-web` and binds to
`coin-archive-api` before deploying. Then run the Archive check. It discovers a
Coin on Explore's first page and an Issuer with at least two result pages, and
confirms the API Worker has no public endpoint:

```bash
pnpm --filter web check:deployed-archive https://coinarchive.app
```

The check requires a Playwright Chromium browser. Install it with
`pnpm --filter web exec playwright install chromium` if needed.

## Testing

Run the deterministic test suite from the repository root:

```bash
pnpm test
```

For an interactive watch session or a coverage report, target the web workspace:

```bash
pnpm --filter web test:watch
pnpm --filter web test:coverage
```

See the [testing guide](docs/testing.md) for workspace-specific commands,
conventions, and coverage policy.

## API

The first-run setup above creates `apps/api/.env.local`. To run only the
standalone Node API from the repository root:

```bash
pnpm --filter api dev
```

The API defaults to port 3001. Its liveness contract is available at
`GET /health`, PostgreSQL-backed readiness is available at `GET /ready`, and
its generated contract is available at `GET /openapi.json`.
See the [API usage guide](apps/api/README.md) for routes, filtering, pagination,
errors, and request examples.

Coin image URLs use the API's required `IMAGE_BASE_URL` setting. Local setup
points it at the web application's public assets; deployment setup for the
future R2 bucket and custom image domain is documented in the
[R2 image delivery guide](docs/r2-images.md).

## Database

The first-run setup above creates `.env.local`. Replace its example password,
then start or stop the persistent local PostgreSQL service from the repository
root:

```bash
pnpm db:start
pnpm db:stop
```

Database schemas live in the private `@coin-archive/db` package. Generate and
commit SQL migrations after changing its schema, then apply migrations
explicitly. API startup never applies migrations. The migration command loads
the root `.env.local` file and builds its connection URL from the same
`POSTGRES_*` values used by Compose. An exported `DATABASE_URL` takes
precedence when targeting another environment.

```bash
DATABASE_URL=postgresql://... pnpm db:generate
pnpm db:migrate
```

To return the local database to its committed migrated and seeded state without
recreating the container or volume, run the explicit reset command:

```bash
pnpm db:reset
```

This permanently removes the existing application schema and prints the target
database name before doing so. It accepts only database URLs whose parsed host
is exactly `localhost` or `127.0.0.1`; there is no remote-reset override. The API
never resets, migrates, or seeds a database during startup.

### Neon staging database maintenance

See the [complete Neon staging workflow](docs/neon-staging.md) for initial
setup, pooled-versus-direct URL placement, local staging development, manual
dummy Coin data, recovery, and the manual smoke test.

The personal staging database is the Neon project's default branch. Create its
private root environment file from the committed example, then replace the
placeholder with the branch's **direct (unpooled)** connection string from
Neon. The pooled application connection string does not belong in this file.

```bash
cp .env.staging.example .env.staging.local
```

The private `.env.staging.local` file is ignored by Git. Apply all checked-in
migrations and transactionally load the committed Issuer and Coin seed data
with the dedicated commands:

```bash
pnpm db:migrate:staging
pnpm db:seed:staging
```

Staging seed is intentionally non-idempotent and is meant for an empty,
migrated database. If committed or manually entered records conflict, it fails
and rolls back instead of updating or overwriting them.

To inspect the configured database's credential-free target identity, run:

```bash
node --env-file=.env.staging.local -e 'const url = new URL(process.env.DATABASE_URL); console.log(`${url.hostname}/${decodeURIComponent(url.pathname.slice(1))}`)'
```

Then pass that exact `<host>/<database>` identity to the reset command:

```bash
pnpm db:reset:staging --confirm '<host>/<database>'
```

**Warning:** this command drops the confirmed database's `public` application
schema and Drizzle migration-history schema. It rejects local, pooled,
non-Neon, host-overridden, and unconfirmed targets, but the confirmation does
not prove project or branch ownership. Verify the target in the Neon Console
before every destructive reset. Ordinary `db:migrate`, `db:seed`, and
loopback-only `db:reset` continue to use `.env.local`.

The real Drizzle/`pg` readiness path has a separate integration command. It
starts and stops its own local Compose service while retaining its volume. The
suite also exercises the complete reset lifecycle against a separate
`coin_archive_reset_test` database:

```bash
pnpm test:db
```

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@coin-archive/ui/components/button"
```
