# Testing Toolchain and Boundaries

Coin Archive will use Vitest for package and application tests, Playwright for browser end-to-end tests, and real PostgreSQL databases for database integration tests. Test suites will be organized around package and application ownership boundaries rather than around a single global test category layout.

Vitest was chosen because Coin Archive is an ESM TypeScript workspace built around Vite and TanStack tooling, so it keeps the local test runner close to the application runtime and avoids Jest-specific configuration overhead. Playwright was chosen for end-to-end tests because critical catalogue workflows should eventually be verified in a real browser, but those tests should remain a thin layer over the most important user journeys.

The first testing surface will be `packages/db`, because the current product behavior depends most on database schema constraints, Drizzle queries, issuer hierarchy filtering, and mapping query rows into catalogue records. Database integration tests should run against PostgreSQL rather than an in-memory substitute, because recursive issuer filtering, constraints, migrations, and PostgreSQL-specific behavior are part of the system contract.

`apps/web` will use Vitest for route, loader, and component behavior where that gives fast feedback, and Playwright for a smaller number of end-to-end catalogue journeys. `packages/ui` tests are deferred until reusable UI components contain meaningful behavior beyond styling and composition.

Database integration tests should run against isolated test database state, using a shared PostgreSQL service only as infrastructure. Tests should create purpose-built issuers and coins for each behavior under test instead of depending on local seed data. Integration setup should apply migrations before tests run so the tested database contract matches the schema that will be deployed.

Package and application tests should live near the code they protect, while browser end-to-end tests may live in a dedicated end-to-end test folder. Test commands should remain split by feedback loop: fast package and application tests, database integration tests, and browser end-to-end tests should be runnable separately, with CI responsible for running the full set.
