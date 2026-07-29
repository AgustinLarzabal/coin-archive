# Cloudflare Workers deployment

Coin Archive is deployed as a TanStack Start Cloudflare Worker. The Worker uses Node.js compatibility because Better Auth, `postgres`, and the AWS S3-compatible R2 client rely on Node.js APIs.

Deploy the web application from `apps/web` with one of these commands. Each selects its named Wrangler environment during both the Vite build and deployment, so its non-secret Worker settings are included in the generated Worker configuration:

- `pnpm deploy:staging`
- `pnpm deploy:production`

To validate either deployment without publishing it, use `pnpm validate:deployment:staging` or `pnpm validate:deployment:production`.

Local development remains unchanged: copy `.env.example` to `.env`, fill the local values, and run `pnpm dev` from the repository root. Cloudflare credentials are not needed locally.

## Environment contract

The versioned [`apps/web/wrangler.jsonc`](/apps/web/wrangler.jsonc) declares the non-secret Worker settings for each isolated environment.

| Setting                | Staging                                  | Production                               |
| ---------------------- | ---------------------------------------- | ---------------------------------------- |
| Application hostname   | `https://staging.coinarchive.app`        | `https://coinarchive.app`                |
| Surface Image hostname | `https://images.staging.coinarchive.app` | `https://images.coinarchive.app`         |
| Worker name            | `coin-archive-staging`                   | `coin-archive`                           |
| R2 bucket              | `coin-archive-staging-surface-images`    | `coin-archive-production-surface-images` |

Set these secrets separately for each Worker environment. They must never be committed:

- `DATABASE_URL`: the environment's direct pooled Neon PostgreSQL connection URL. Do not configure Cloudflare Hyperdrive.
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

The Worker also requires these non-secret runtime settings, which are supplied by `wrangler.jsonc`:

- `BETTER_AUTH_URL`
- `R2_ENDPOINT`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

`VITE_AUTH_GOOGLE_ENABLED=true` is a build-time setting for the browser bundle; set it in the environment that runs the Worker build. It is not a Worker secret.

Before deployment, the application validates this complete runtime contract and returns a clear missing-setting error rather than attempting a partial connection. In a CI deployment, set secrets through the matching GitHub environment, then use `wrangler secret put <name> --env staging` or `--env production` if provisioning Workers directly.

## Direct database connection check

After supplying an environment's `DATABASE_URL`, run `pnpm --filter @coin-archive/db verify:connection`. The command issues a read-only `select 1` through the same direct `postgres` client used by the application, then closes the connection. Run it with the staging or production environment's URL before releasing that environment; it does not use Cloudflare Hyperdrive.

## Production promotion

Production promotion begins only when the **Deploy staging** GitHub Actions workflow succeeds. Configure the repository's `production` GitHub environment with the maintainer as its required reviewer and store only production `DATABASE_URL` and `CLOUDFLARE_API_TOKEN` secrets there. GitHub records the staging deployment and the required environment approval.

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
