# Public Archive traffic limit

The web Worker checks every TanStack Start page and server-function request
before it can call the private API. Cloudflare sets `CF-Connecting-IP` at the
trusted edge; the Worker uses that value as the per-caller key. A production
request without it fails closed with 503. Excess requests receive 429,
`Retry-After: 60`, and `Cache-Control: no-store`. Static assets are outside
TanStack Start and cannot initiate catalogue work.

The provisional binding in `wrangler.jsonc` allows **120 requests per IP per 60
seconds per Cloudflare location**. Preproduction route checks show a normal
Explore render uses 12 private API reads; a filtered page followed by
navigation uses 13 reads across both views. The 100,000-Coin pagination
calibration in `docs/performance/coin-pagination-100k.md` measured a maximum
warm API sample around 56 ms. These checks give the starting budget: a single
IP can make about two public requests per second, while the most expensive
uncached Explore requests remain bounded by the binding. Before launch, replay
representative page, filter, pagination, and detail traffic against staging and
check web `archive_request` 429 counts, `archive_backend` status and duration,
and database CPU/connections. Adjust `simple.limit` in `wrangler.jsonc` if
normal traffic is blocked or database load is too high; regenerate Worker
types and redeploy. Repeat this check after major catalogue or traffic changes.

Logs contain only HTTP status and elapsed time. No IP, query string, headers,
or credentials are logged. Cloudflare request logs and these
events show rejection rate and private API call volume; database metrics show
the downstream cost. Cloudflare counters are approximate and separate by
location, so 120 is not a strict global cap. Visitors sharing an IP also share
the limit and may receive a false positive 429 during a busy minute.
