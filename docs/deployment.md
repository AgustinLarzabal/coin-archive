# Cloudflare Workers deployment

Coin Archive is deployed as a TanStack Start Cloudflare Worker and a separate API Worker. The Workers use Node.js compatibility because Better Auth, `postgres`, and the AWS S3-compatible R2 client rely on Node.js APIs.

The supported release entry points are the **Deploy staging** and **Promote verified staging commit to production** GitHub Actions workflows. They validate release configuration, migrate the database, synchronize Worker secrets, and only then publish both Workers.

These package scripts are low-level Worker publication commands. They select the named Wrangler environment, but they do not run the release preflight, migrate the database, or synchronize secrets:

- `pnpm --filter api run deploy:staging`, then `pnpm --filter web run deploy:staging`
- `pnpm --filter api run deploy:production`, then `pnpm --filter web run deploy:production`

To validate either deployment without publishing it, use `pnpm validate:deployment:staging` or `pnpm validate:deployment:production`.

Local development remains unchanged: copy `.env.example` to `.env`, fill the local values, and run `pnpm dev` from the repository root. Cloudflare credentials are not needed locally.

## Run local code against a remote environment

For production-like debugging, the web app and API Worker can run locally while using an environment's remote Neon database and R2 bucket. Copy the matching template and supply credentials for that environment:

```sh
cp .env.staging.example .env.staging.local
cp .env.production.example .env.production.local
```

The `.local` profiles are ignored by Git. Keep `BETTER_AUTH_URL` and `PUBLIC_API_BASE_URL` pointed at localhost: the browser talks to the locally running web app, and the local web app talks to the locally running API Worker. The local API receives the selected environment's `API_ENVIRONMENT`, Surface Image origin, database URL, and rate-limit configuration.

Run the staging profile with:

```sh
pnpm dev:staging
```

Connecting local code to production is deliberately guarded because maintenance actions can change real catalogue data and upload or delete real Surface Images. Prefer read-only or least-privilege production credentials. To acknowledge the risk and start the production profile:

```sh
ALLOW_PRODUCTION_DEBUG=true pnpm dev:production
```

These commands do not download Worker secrets from Cloudflare; secret values cannot be retrieved after being stored there. Populate the local profile from the matching password manager or secret source. A Google OAuth client used by a local profile must allow the localhost Better Auth callback.

## Environment contract

The versioned [`apps/web/wrangler.jsonc`](/apps/web/wrangler.jsonc) declares the non-secret Worker settings for each isolated environment.

| Setting                | Staging                                  | Production                               |
| ---------------------- | ---------------------------------------- | ---------------------------------------- |
| Application hostname   | `https://staging.coinarchive.app`        | `https://coinarchive.app`                |
| Surface Image hostname | `https://images.staging.coinarchive.app` | `https://images.coinarchive.app`         |
| Worker name            | `coin-archive-staging`                   | `coin-archive`                           |
| R2 bucket              | `coin-archive-staging-surface-images`    | `coin-archive-production-surface-images` |

`DATABASE_URL` is required by both the API and web Workers in each environment. Better Auth, Google OAuth, and R2 credentials belong only to the API Worker. The release workflows synchronize all of these secrets from the corresponding protected GitHub environment before either Worker is published. They must never be committed:

- `DATABASE_URL`: the environment's direct pooled Neon PostgreSQL connection URL. Do not configure Cloudflare Hyperdrive.
- `BETTER_AUTH_SECRET` (API only)
- `GOOGLE_CLIENT_ID` (API only)
- `GOOGLE_CLIENT_SECRET` (API only)
- `R2_ACCESS_KEY_ID` (API only)
- `R2_SECRET_ACCESS_KEY` (API only)

The Workers also require these non-secret runtime settings, which are supplied by their `wrangler.jsonc` files:

- `BETTER_AUTH_URL` (API auth origin)
- `BETTER_AUTH_TRUSTED_ORIGINS` (matching web origin)
- `R2_ENDPOINT`
- `R2_BUCKET`
- `SURFACE_IMAGE_ORIGIN`

Each release also applies [`infrastructure/r2-surface-image-lifecycle.json`](/infrastructure/r2-surface-image-lifecycle.json) to its environment's bucket. The rule expires only `surface-images/temporary/` objects after one day. Published objects use `surface-images/published/` and are outside the lifecycle prefix.

`VITE_AUTH_GOOGLE_ENABLED` and `VITE_SHOW_SIGN_IN_BUTTON` are build-time settings for the browser bundle; set them in the environment that runs the Worker build. They are not Worker secrets, and either setting may intentionally be `false`.

Before migration or deployment, each release workflow runs a preflight that rejects blank required secrets and build variables. A failed preflight reports all missing setting names in one error without printing or serializing their values, so incomplete configuration stops the release before it can change the database.

After a successful migration, the workflow writes restricted, runner-temporary JSON documents and bulk-synchronizes the API Worker secrets and the web Worker's `DATABASE_URL`. It publishes neither Worker until both secret uploads succeed.

Both Workers also retain request-time runtime validation as defense in depth. This check produces a clear missing-setting error without exposing values, but it is not a pre-deployment check and does not replace the supported release workflow.

If provisioning a Worker directly for recovery work, set secrets through the matching protected source and use `wrangler secret put <name> --env staging` or `--env production`. A direct Wrangler or `deploy:*` invocation remains a low-level operation and does not provide the migration-aware release guarantees above.

## Direct database connection check

After supplying an environment's `DATABASE_URL`, run `pnpm --filter @coin-archive/db verify:connection`. The command issues a read-only `select 1` through the same direct `postgres` client used by the application, then closes the connection. Run it with the staging or production environment's URL before releasing that environment; it does not use Cloudflare Hyperdrive.

## Production promotion

Production promotion begins only when the **Deploy staging** GitHub Actions workflow succeeds. Configure the repository's `production` GitHub environment with the maintainer as its required reviewer and store the production `DATABASE_URL`, `BETTER_AUTH_SECRET`, Google OAuth credentials, and `CLOUDFLARE_API_TOKEN` secrets there. GitHub records the staging deployment and the required environment approval.

The production workflow checks out the exact commit from that successful staging run, then waits for the protected `production` environment approval. The maintainer approves only after manual staging verification. It applies pending production migrations before deploying the production Worker, never resets or seeds data, and stops the release before Worker deployment if a migration fails.

## Manual staging reset and initial Admin bootstrap

Normal deployments only build and release the Worker; they do not load demo data. To explicitly replace all staging data with generated demo data, manually dispatch the **Reset staging data** GitHub Actions workflow. It is the only supported reset entry point: it runs in the protected `staging` environment using that environment's database secret, and the reset command refuses to run outside that workflow. It resets the database schema, reapplies migrations, and loads the generated demo catalogue. It also removes staging Collector identities, so complete the intended Google sign-in again before bootstrap.

To establish an environment's first Admin, first sign in with the intended Google address, then manually dispatch the **Bootstrap initial Admin** GitHub Actions workflow and select `staging` or `production`. The selected protected environment supplies its `DATABASE_URL` and `INITIAL_ADMIN_EMAIL` secrets; set the latter to `agustinlarzabal@gmail.com` in each environment.

Bootstrap promotes only the configured, email-verified Collector that has a linked Google account. It refuses a missing or mismatched Collector, an ineligible Collector, and any environment that already has an Admin. It never selects an Admin by sign-in order.

## Private staging verification

Cloudflare Access protects two staging applications before traffic can reach the Worker or the staging R2 custom domain:

- `staging.coinarchive.app`
- `images.staging.coinarchive.app`

Each application uses the same allow policy: Google identity email equals `agustinlarzabal@gmail.com`. Do not add a bypass policy, service token, or production hostname to either application. Production hosts remain outside these policies: `coinarchive.app` stays public and `images.coinarchive.app` serves the separate production bucket.

After a staging deployment, or after manually resetting staging, perform this smoke check:

The deployment workflow also runs `pnpm verify:staging` after both Workers
deploy. The `apps/staging-verification` application workspace is an automated
release smoke-test harness: its local Cloudflare Worker proxy reaches the
private staging web Worker through a remote service binding without weakening
the Access policy. The check uses a short-lived Better Auth session, crosses
the web backend-for-frontend and API Worker, verifies an Orientation in staging
PostgreSQL, and removes its records.

The workspace's proxy unit test is fast and remains part of the ordinary
`pnpm test` graph. The deployed verification is environment-dependent and stays
in the post-deployment release workflow; do not replace it with a local check
that requires copying protected staging credentials.

1. In a private browser session, visit each staging hostname. Both must redirect to Cloudflare Access before returning application or image-host content. A header-only check is also useful:

   ```sh
   curl -I https://staging.coinarchive.app/
   curl -I https://images.staging.coinarchive.app/
   ```

   Each response must be a Cloudflare Access redirect and include `www-authenticate: Cloudflare-Access`.

2. Sign in through Cloudflare Access as `agustinlarzabal@gmail.com`, then visit `https://staging.coinarchive.app` and confirm the generated demo catalogue loads. Sign in to Coin Archive there with Google as the same address; this separate Better Auth sign-in creates the Google-authenticated Collector required by bootstrap. After a reset, complete both sign-ins before dispatching the initial-Admin bootstrap workflow above.

3. Run the **Bootstrap initial Admin** workflow above for staging. As the resulting Admin, upload a test Surface Image through Coin Maintenance and open its `images.staging.coinarchive.app` URL in the same browser session. It must load only after the Access sign-in; a private session must redirect to Access instead.

4. In a separate private session, visit `https://coinarchive.app` and `https://images.coinarchive.app`. They must not redirect to the staging Access application. This confirms that production remains a distinct public environment.

Keep Neon URLs, R2 credentials, Google OAuth credentials, Better Auth secrets, and Cloudflare deployment tokens only in their matching GitHub `staging` or `production` environment. Never copy a production secret into staging; the staging workflow receives only the `staging` environment's `DATABASE_URL` and Cloudflare deployment token.
