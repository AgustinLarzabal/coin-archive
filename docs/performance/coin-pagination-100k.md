# Coin pagination at 100,000 Coins

Issue #51 validates live numbered pagination against a representative Archive
without committing generated records. The reproducible harness generates the
records in PostgreSQL, captures `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` plan
summaries, and calls the real HTTP application with the real database boundary.

## Reproduce

Start the integration PostgreSQL service and create the dedicated database once:

```bash
docker compose --profile integration-test up -d --wait postgres-test
docker exec coin-archive-postgres-test-1 \
  createdb -U coin_archive_test coin_archive_performance
```

Then run:

```bash
DATABASE_URL=postgresql://coin_archive_test@127.0.0.1:5433/coin_archive_performance \
  pnpm performance:coin-pagination
```

The harness truncates and rebuilds its dataset on each run. It refuses to run
unless the database name is exactly `coin_archive_performance`.

## Dataset

- 100,000 Coins split evenly across 10 Issuers.
- Alternating Issue Periods of 1988 and 1970, so the measured `1986-1990`
  overlap range selects exactly 50,000 Coins.
- Creation timestamps shared in groups of 1,000 Coins, making the Coin-ID
  ascending tie-breaker observable.
- 50,000 Obverse surfaces and Engraver credits distributed evenly across 10
  Engravers; the measured Engraver therefore matches 5,000 Coins.
- Page size 100, the public API hard maximum.
- First, middle, and deepest non-empty pages for unfiltered, Issuer-filtered,
  Engraver-filtered, and Issue Period overlap requests.

The public API assertions check status, exact `page`, `pageSize`, `totalItems`,
and `totalPages`, exactly 100 Coins, and the complete known sequence of 100 Coin
IDs for every generated page. Those IDs exercise both creation-time descending
order and Coin-ID ascending tie ordering.

## Measurements

Measured locally on PostgreSQL 17. These are single warm runs intended to compare
plans and catch order-of-magnitude regressions, not production latency targets.
The page-plan time excludes the exact-count query; API time includes the count,
page rows, page Surface images, serialization, and in-process HTTP handling.

| Path       |  Page | Baseline plan ms | Final plan ms | Baseline API ms | Final API ms |
| ---------- | ----: | ---------------: | ------------: | --------------: | -----------: |
| Unfiltered |     1 |           52.515 |         0.111 |          75.058 |       31.145 |
| Unfiltered |   500 |           76.086 |        21.614 |          61.931 |       23.394 |
| Unfiltered | 1,000 |           80.584 |        41.306 |          89.740 |       32.514 |
| Issuer     |     1 |           13.983 |         0.093 |          30.266 |        9.310 |
| Issuer     |    50 |           30.966 |         6.322 |          32.400 |       22.596 |
| Issuer     |   100 |           43.706 |         6.108 |          38.668 |       12.158 |
| Engraver   |     1 |           30.570 |         4.003 |          54.184 |       27.131 |
| Engraver   |    25 |           33.721 |        34.755 |          44.069 |       43.459 |
| Engraver   |    50 |           36.123 |        34.857 |          56.175 |       41.513 |
| Year range |     1 |                — |         0.100 |               — |       14.560 |
| Year range |   250 |                — |        13.237 |               — |       22.315 |
| Year range |   500 |                — |        25.716 |               — |       29.836 |

The final plan shapes were:

- Unfiltered pages: ordered `coins_created_at_id_index` scan for first, middle,
  and deep pages.
- Issuer pages: ordered `coins_issuer_id_created_at_id_index` scan on the first
  page; PostgreSQL chose the same index as a bitmap scan plus an in-memory sort
  for the middle and deep pages.
- Engraver pages: ordered Coin index plus nested semi-joins on the first page;
  hash joins and an in-memory sort for middle and deep pages.
- Year-range pages: ordered `coins_created_at_id_index` scans for first, middle,
  and deep pages, with the inclusive Issue Period overlap applied as a filter.

The persistence query now selects the bounded Coin page before loading Obverse
and Reverse image keys for those at-most-100 Coins. This prevents the Surface
joins from hiding the ordering index while keeping all reads in the same
repeatable-read snapshot.

## Engraver index decision

A temporary `(engraver_id, coin_surface_id)` probe index was measured against
the final query shape and then removed. PostgreSQL used it for middle and deep
pages, reducing their page-plan times from 34.755 ms to 27.534 ms and from
34.857 ms to 26.178 ms. The corresponding API samples moved from 43.459 ms to
38.701 ms and from 41.513 ms to 37.797 ms, but unrelated scenarios varied by a
similar amount between these single runs.

The unindexed Engraver page plans remain below 35 ms at the target size, and the
probe's 7–9 ms plan reduction does not justify its additional write and storage
cost or an Engraver query rewrite. The reproducible harness remains available to
revisit that decision as the Archive shape changes.

## Issue Period overlap index decision

The `1986-1990` range matched half of the representative 100,000-Coin Archive.
PostgreSQL retained the existing ordered Coin index for every measured page; the
deepest page plan completed in 25.716 ms and the full API request in 29.836 ms.
No supporting Issue Period index was added because this broad overlap query is
already bounded by the existing ordered scan at the target catalogue volume.
The harness now keeps these range scenarios alongside the other pagination
paths so the decision can be revisited if catalogue size or selectivity changes.
