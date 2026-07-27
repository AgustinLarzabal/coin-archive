# Required Staging Verification Suite

GitHub Actions must pass `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm db:test` before staging deployment proceeds. This adopts the repository’s existing automated verification commands as the release gate while browser end-to-end tests remain deferred.
