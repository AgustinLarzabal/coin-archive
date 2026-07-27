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
