# Production promotion

Production promotion is a manual GitHub Actions workflow. It promotes the commit selected by running **Production promotion** on `main`, only while that commit remains the current `main` commit and its **Staging release** run succeeded. The workflow checks eligibility after approval and again immediately before migration. A newer merge or failed staging run makes the promotion ineligible. Wait for the newer staging release, then start a new promotion.

## GitHub setup

Create a `production` environment with required reviewers. Store these values **on that environment**, so the promotion job cannot access production credentials before approval:

- Secret `PRODUCTION_DATABASE_URL`: the direct, unpooled Neon PostgreSQL connection URL for the production database. Its role needs migration permissions. Never use the pooled Worker URL.
- Variables `PRODUCTION_DATABASE_HOST` and `PRODUCTION_DATABASE_NAME`: the exact credential-free host and database name from that direct URL.
- Variable `PRODUCTION_WEB_ORIGIN`: `https://coinarchive.app`.
- Secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`: the production account and token. The token needs Worker deployment, Workers Scripts Read, account-wide Zone Read, and Workers Routes Read permissions. Keep its scope limited to the production account.

The job's `GITHUB_TOKEN` needs Actions Read and Contents Read. The workflow grants both. The production API Worker uses the default Hyperdrive binding in `apps/api/wrangler.jsonc`; the web Worker uses the default service binding and custom domain in `apps/web/wrangler.jsonc`. Confirm these refer to the intended production resources before promotion.

## Promote

1. Review any migrations for compatibility with the Workers currently deployed to production. They must continue working between migration and Worker deployment.
2. Confirm the current `main` commit has a successful **Staging release** run, including its deployed checks.
3. Start **Production promotion** from the Actions tab, selecting `main`, then have a required reviewer approve the `production` environment deployment.
4. Watch the run. It builds and tests, checks the database identity and deployment configuration, dry-runs both Workers, rechecks eligibility, applies checked-in migrations, deploys the private API Worker, verifies its privacy, deploys the web Worker, and runs the deployed Archive browser check. Success is recorded only after every stage passes.

The fixed `production-promotion` concurrency group allows one production run at a time. Local and pull-request tests use command mocks and never publish production. The release never resets or seeds the database.

## Failure and recovery

The failing stage appears in the Actions log. A failed stage stops all later stages. If migration succeeded before a deploy or browser check failed, the migration remains applied. Inspect the live database and both Worker deployments, fix the cause, and start another promotion of the current `main` commit after staging succeeds. Do not assume code or schema rolled back. If a newer commit has reached `main`, wait for its staging release and promote that commit instead. Restore older code or reverse a migration only as a separate, reviewed manual decision.
