# Public Archive traffic limit

The web Worker checks every TanStack Start page and server-function request
before it can call the private API. Cloudflare sets `CF-Connecting-IP` at the
trusted edge; the Worker uses that value as the per-caller key. A production
request without it fails closed with 503. Excess requests receive 429,
`Retry-After: 60`, and `Cache-Control: no-store`. Static assets are outside
TanStack Start and cannot initiate catalogue work.

The initial binding in `wrangler.jsonc` allows **120 requests per IP per 60
seconds per Cloudflare location**. Preproduction route checks show a normal
Explore render uses 12 private API reads; a filtered page followed by
navigation uses 13 reads across both views. The 100,000-Coin pagination
calibration in `docs/performance/coin-pagination-100k.md` measured a maximum
warm API sample around 56 ms. These checks give the starting budget: a single
IP can make about two public requests per second, while the most expensive
uncached Explore requests are limited during sustained traffic. The staging results
below selected this initial threshold. Monitor web `archive_request` 429 counts,
`archive_backend` status and duration, and database CPU/connections after
launch. Adjust `simple.limit` in `wrangler.jsonc` if normal traffic is blocked
or database load is too high; regenerate Worker types and redeploy. Repeat this
check after major catalogue or traffic changes.

Logs contain only HTTP status and elapsed time. No IP, query string, headers,
or credentials are logged. Cloudflare request logs and these
events show rejection rate and private API call volume; database metrics show
the downstream cost. Cloudflare counters are approximate and separate by
location, so 120 is not a strict global cap. Visitors sharing an IP also share
the limit and may receive a false positive 429 during a busy minute.

## Staging verification

`pnpm dev:staging` runs locally and bypasses the Worker limit. Measure a deployed
staging Worker instead. The `staging` Wrangler environments create separate
`coin-archive-api-staging` and `coin-archive-web-staging` Workers. The staging
API has no public route; the staging web Worker has a public `workers.dev` URL
for the check and uses its own rate-limit namespace.

1. In the Neon staging project, create a dedicated API database role and grant
   it `USAGE` on the `public` schema and `SELECT` on its tables. Use Neon's
   connection details for that role with pooling **disabled**; the existing
   `.env.staging.local` URL belongs to the maintenance owner and must not be
   used by the deployed API. In the Cloudflare dashboard, create a Hyperdrive
   configuration named `coin-archive-staging` with that direct URL. Do not use
   the production Hyperdrive or put the URL in a command argument. In the
   current dashboard, start with **Connect database**. The resulting
   configuration ID is bound in `apps/api/wrangler.jsonc`.
   Disable Hyperdrive query caching for this connection, matching production;
   its default cache can serve SQL results for longer than the Archive's
   one-minute freshness target.
2. Check and deploy the private staging API, then build and deploy the staging
   web Worker. `pnpm --filter api deploy:worker` targets production, so use the
   explicit staging commands below:

   ```bash
   pnpm --filter api check:privacy
   pnpm --filter api exec node scripts/check-private-worker.mjs --deploy --staging
   pnpm --filter api exec wrangler deploy --env staging --dry-run
   pnpm --filter api exec wrangler deploy --env staging
   CLOUDFLARE_ENV=staging pnpm --filter web build
   pnpm --filter web exec wrangler deploy --dry-run
   pnpm --filter web exec wrangler deploy
   ```

   Confirm both dry runs name the staging Workers and show the staging API and
   Hyperdrive bindings before deploying. The web URL appears in Wrangler's
   deploy output. With an account-scoped `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID` set locally, run
   `pnpm --filter api exec node scripts/check-deployed-private-worker.mjs --staging`
   to verify the deployed staging API remains private. Run
   `pnpm --filter web check:deployed-archive <web-origin> <coin-path> <coin-title> --staging`
   for the existing HTML and private API smoke check.

3. Browse the staging web URL: load Explore and Coin detail directly, then
   navigate, change a filter, and paginate. In browser developer tools, confirm
   each public request succeeds and that browser traffic stays on the web
   origin. Repeat ordinary browsing on two devices sharing one network.
4. Set `STAGING_COIN_URL` to a valid Coin detail URL on the staging web Worker.
   From one machine, run the burst below within one minute; run it only against
   this staging URL. It reports response status counts. Then inspect one 429
   response for `Retry-After: 60`, and try a filter change in the browser while
   the caller is limited to check the server-function path.

   ```bash
   for i in {1..140}; do curl -sS -o /dev/null -w '%{http_code}\n' "$STAGING_COIN_URL"; done | sort | uniq -c
   curl -i "$STAGING_COIN_URL"
   ```

5. In Cloudflare Workers Observability for both staging Workers, compare
   `archive_request` 429s, `archive_backend` counts and duration, and API errors.
   In Neon Monitoring, inspect CPU and connections over the same interval.
   Record the ordinary per-IP peak, 429 count, backend request rate and latency,
   and database load. Cloudflare counters are approximate, so a 429 need not
   occur on exactly request 121. Choose the production threshold from those
   measurements, update `simple.limit` in `apps/web/wrangler.jsonc`, and
   document the result here before closing issue #116.

### Initial check, 2026-11-21

The deployed staging web Worker used the staging API service binding and a
separate rate-limit namespace in Cloudflare's Madrid location. Its Hyperdrive
used the staging Neon host with query caching disabled. The read-only API role
could SELECT all 18 current tables.

- 36 distinct Explore page loads over six seconds returned 200. Client-side
  p95 was 505 ms. PostgreSQL recorded 56 more commits, 6,207 buffer hits, and
  one buffer read; it reported 17 backends after the run. This is a short
  staging sample, not a production capacity measurement.
- 170 paced Coin detail requests over about 20 seconds returned 121 responses
  with 200 and 49 with 429. The first 429 arrived at request 122 and included
  `Retry-After: 60`. A server-function URL also returned 429 while this caller
  was limited. In the sampled Worker logs, five 429 requests had no
  `archive_backend` call, while 24 allowed requests did.
- A separate 140-request burst completed in about two seconds with all 200
  responses. Cloudflare's approximate counters do not protect against a very
  fast burst or a distributed surge.

Keep 120 requests per 60 seconds as the initial per-IP threshold: ordinary
staging browsing and the varied page check succeeded, while a sustained single
caller was limited before private API work. Recheck 429s and database load
after launch, especially for visitors sharing a network.
