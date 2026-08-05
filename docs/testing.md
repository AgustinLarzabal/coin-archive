# Testing Strategy

Coin Archive tests are organized around package and application ownership boundaries. Each boundary should use the cheapest test type that proves the behavior that boundary owns.

## Test surfaces

`packages/db` is the first testing surface. It owns database schema constraints, migrations, Drizzle queries, issuer hierarchy filtering, and mapping database rows into catalogue records.

`apps/web` will use Vitest for route, loader, and component behavior where fast feedback is useful. Browser end-to-end tests should use Playwright for a small number of critical catalogue journeys once the web app has workflows worth protecting.

`apps/staging-verification` is an application workspace for the automated
deployed staging release smoke test. Its Vitest proxy unit test is fast and
participates in the ordinary root test graph. The deployed verification is a
separate, environment-dependent release step: a local Cloudflare Worker proxy
uses a remote service binding to reach the private staging web Worker, then the
harness verifies one Orientation Maintenance path through the web
backend-for-frontend, API Worker, and staging PostgreSQL.

`packages/ui` tests are deferred until reusable UI components contain meaningful behavior beyond styling and composition.

## Not yet

The first testing rollout should stay focused. It should not include:

- `packages/ui` tests
- Playwright setup
- CI configuration
- accessibility testing
- coverage thresholds
- seed script tests
- type-level test tooling
- arbitrary issuer grouping cycle prevention tests
- exhaustive constraint, index, default, or varchar length tests
- snapshots by default

## Test files

Package and application tests should live near the code they protect.

- Use `*.test.ts` for fast unit and package tests.
- Use `*.integration.test.ts` for tests that require PostgreSQL.
- Keep browser end-to-end tests in a dedicated end-to-end test folder when Playwright is introduced.

Test names should describe observable behavior rather than implementation details.
Test files should import Vitest APIs explicitly, such as `import { describe, expect, it } from "vitest"`, instead of relying on globals.

Integration tests should group cases by behavior area. Function-name `describe` blocks are appropriate when a function is the direct public subject, such as a mapper unit test.

## Database tests

Database integration tests should run against PostgreSQL, not an in-memory substitute. They should apply migrations before tests run so the tested schema matches the deployed database contract.

Tests should use isolated database state. A shared Docker Compose PostgreSQL service may provide infrastructure, but each test run should avoid depending on development data or the order of other tests.

Automated tests should create purpose-built issuers and coins for the behavior under test. Seed data is for local exploration and demos, not test assertions.

Database integration tests should run serially at first. Use a dedicated test database, apply migrations once before the integration test run, and clear tables between tests with an explicit helper when needed. Do not start with transaction-per-test isolation unless all writes are guaranteed to use the same transaction context.

The first database integration behavior to protect is issuer filtering: selecting an issuer should return coins linked to that issuer and coins linked to descendant issuers, while excluding unrelated issuers.

Query tests should assert the fields that prove the behavior under test rather than full database rows. Mapper tests may assert exact object shapes because mapping is their direct responsibility.

Ordering tests should insert explicit timestamps rather than relying on database defaults or fake timers. The initial suite should test newest-first ordering and the default `getCoins` limit, but it does not need a matrix of limit edge cases or UUID tie-break ordering.

An unknown issuer filter should return an empty list. It should not throw and should not fall back to unfiltered results.

Schema constraint tests should focus on catalogue rules:

- issuer codes are globally unique
- issuer codes are lowercase slug-style text
- an issuer cannot parent itself
- a coin must have exactly one direct issuer

Avoid testing every timestamp default, index, varchar length, or foreign key in isolation unless it protects an important catalogue assumption or fixes a known bug.

Arbitrary issuer grouping cycle prevention is a separate data-integrity decision. The initial testing rollout should test the existing direct self-parent constraint, but it should not imply that multi-issuer cycles are already prevented.

## Public behavior and helpers

Tests should prefer public package behavior. Internal query builders may accept database clients when that improves isolation, but test-only helpers should stay out of public package exports.

Keep fixture builders and database setup helpers in test-only files. Do not export them from `packages/db/src/index.ts`.

## Commands

Test commands should remain split by feedback loop:

- `pnpm test` for fast package and application tests
- `pnpm test:db` for PostgreSQL-backed database integration tests
- `pnpm test:e2e` for future Playwright browser tests
- `pnpm verify:staging` for the deployed staging release smoke test after both Workers deploy

Fast tests should not require Docker. Database integration tests may require Docker Compose. Root scripts should delegate to package-level scripts so developers can run either the whole workspace or a focused package.

The deployed staging verification is intentionally not part of `pnpm test`.
It needs protected staging credentials and deployed services, so the staging
release workflow is its authoritative execution environment. Do not copy those
credentials into a local substitute.

`pnpm test:db` should prepare isolated test database state and apply migrations before running database tests, but starting Docker should remain explicit through `pnpm db:start`. If PostgreSQL is unavailable, the command should fail with a clear message rather than silently starting or resetting infrastructure.

Official test scripts should run once and exit. Do not add watch-mode scripts in the initial testing rollout.

CI configuration is future work. Test scripts should be named plainly enough for CI to reuse later, but the initial testing rollout does not need to add GitHub Actions or any other CI workflow.

Database integration tests should use `DATABASE_TEST_URL`, not `DATABASE_URL`. The setup should refuse to run when the test URL is missing or does not clearly point at a test database. It may create the test database when missing, apply migrations, and clear known tables, but it should not drop and recreate the whole database by default.

## Regression tests

Every bug fix should include a regression test that fails before the fix. The test should live at the smallest boundary that would have caught the bug. If a regression test is impractical, the change should explain why.

Tests do not need to be written first for every change. Database queries, catalogue rules, bug fixes, and risky refactors should become test-backed as they are introduced. UI exploration can add tests after the workflow stabilizes, and trivial visual changes do not need tests unless they protect behavior.

## Verification

Linting and type checking are part of the verification workflow, but they are not substitutes for runtime behavior tests.

- `pnpm lint` checks static and style rules.
- `pnpm typecheck` checks TypeScript contracts.
- `pnpm test` checks fast runtime behavior.
- `pnpm test:db` checks PostgreSQL-backed database behavior.
- `pnpm verify:staging` checks the deployed Orientation Maintenance path as a post-deployment release step.

## First Milestone

The first testing implementation milestone is complete when:

- Vitest is configured for `packages/db`.
- Root and `packages/db` run-once test scripts exist.
- `DATABASE_TEST_URL` is documented in `.env.example`.
- `pnpm test` runs fast tests without Docker.
- `pnpm test:db` requires explicit `pnpm db:start`, prepares the test database, applies migrations, and runs serial database integration tests.
- The mapper unit test asserts the exact mapped object shape.
- Database integration tests cover newest-first coin listing, the default `getCoins` limit, issuer filtering including descendant issuers, and unknown issuer filters returning an empty list.
- Schema constraint tests cover issuer code format, unique issuer codes, and coins requiring an issuer.
- Playwright, `packages/ui` tests, CI configuration, and coverage thresholds remain out of scope.

## Coverage and snapshots

Do not add coverage thresholds at the start. Prefer behavior rules until the suite contains enough meaningful tests for coverage percentages to be useful.

Snapshots are discouraged by default. Use explicit assertions for database records and route data. Snapshots are acceptable only when the output is small, intentionally structural, and easy to review.
