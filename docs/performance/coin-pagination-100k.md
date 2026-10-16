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
  pnpm performance:coin-pagination:gate
```

The harness truncates and rebuilds its dataset on each run. It refuses to run
unless the database name is exactly `coin_archive_performance`.
`performance:coin-pagination` remains an equivalent compatibility command.

## Gate behavior

The command prints the complete measurement JSON and a pass summary when all 15
scenarios satisfy their bounds. On failure it still prints the measurements,
then reports each scenario, metric, actual value, and bound before exiting
nonzero. Response-content and deterministic-order assertions remain part of the
same command.

The primary bounds describe database work rather than one exact plan tree or
machine speed:

- `planRows` is the sum of `Actual Rows * Actual Loops` over all plan nodes.
- `rowsRemovedByFilter` is the equivalent sum for filtered rows.
- `sharedBlocks` is the root plan's shared hits plus reads, avoiding double
  counting child buffers.
- `sortRows` is the work reported by Sort and Incremental Sort nodes.
- Required ordering/filter indexes and forbidden sequential Coin scans enforce
  the documented structural paths while allowing legitimate bitmap scans,
  joins, and in-memory sorts.

Every scenario returns exactly 100 rows, so the returned-row bound is 100. The
execution and in-process API ceilings are respectively 500 ms and 1,000 ms for
all scenarios. Those are deliberately broad last-resort bounds: the recorded
maximum warm plan and API baselines below are about 36 ms and 56 ms, while a
cold first API request has been observed around 183 ms.

The PostgreSQL 17 calibration sample and enforced work bounds are:

| Scenario                | Plan rows baseline / bound | Filtered rows baseline / bound | Shared blocks baseline / bound | Sort rows baseline / bound | Required Coin index                            |
| ----------------------- | -------------------------: | -----------------------------: | -----------------------------: | -------------------------: | ---------------------------------------------- |
| Unfiltered first        |                410 / 1,000 |                        0 / 100 |                       25 / 500 |                      0 / 0 | `coins_created_at_id_index`                    |
| Unfiltered middle       |          150,110 / 250,000 |                        0 / 100 |                    936 / 5,000 |                      0 / 0 | `coins_created_at_id_index`                    |
| Unfiltered deep         |          300,110 / 500,000 |                        0 / 100 |                 1,849 / 10,000 |                      0 / 0 | `coins_created_at_id_index`                    |
| Issuer first            |                401 / 1,000 |                        9 / 100 |                       19 / 500 |                      0 / 0 | `coins_issuer_id_created_at_id_index`          |
| Issuer middle           |            35,101 / 75,000 |                        9 / 100 |                  1,465 / 5,000 |             5,000 / 10,000 | `coins_issuer_id_created_at_id_index`          |
| Issuer deep             |            40,101 / 75,000 |                        9 / 100 |                  1,465 / 5,000 |            10,000 / 10,000 | `coins_issuer_id_created_at_id_index`          |
| Engraver first          |             7,335 / 30,000 |                    991 / 5,000 |                 9,948 / 30,000 |                      0 / 0 | `coins_created_at_id_index`                    |
| Engraver middle         |          232,622 / 500,000 |                        9 / 100 |                 2,519 / 10,000 |              2,500 / 5,000 | none; full scans are accepted                  |
| Engraver deep           |          235,122 / 500,000 |                        9 / 100 |                 2,519 / 10,000 |              5,000 / 5,000 | none; full scans are accepted                  |
| Ruling Authority first  |             2,382 / 30,000 |                      0 / 5,000 |                 4,994 / 30,000 |                      0 / 0 | `coins_created_at_id_index`                    |
| Ruling Authority middle |          127,620 / 500,000 |                        0 / 100 |                 2,009 / 10,000 |              2,500 / 5,000 | `coin_ruling_authorities_authority_coin_index` |
| Ruling Authority deep   |          130,120 / 500,000 |                        0 / 100 |                 2,009 / 10,000 |              5,000 / 5,000 | `coin_ruling_authorities_authority_coin_index` |
| Issue Period first      |                405 / 1,000 |                       99 / 500 |                       16 / 500 |                      0 / 0 | `coins_created_at_id_index`                    |
| Issue Period middle     |           75,105 / 150,000 |                24,999 / 75,000 |                    926 / 5,000 |                      0 / 0 | `coins_created_at_id_index`                    |
| Issue Period deep       |          150,105 / 300,000 |               49,999 / 150,000 |                 1,839 / 10,000 |                      0 / 0 | `coins_created_at_id_index`                    |

The margins are generally about 1.7–5 times measured row work and at least 3
times measured buffer work. Smaller scenarios have minimum floors to tolerate
minor planner bookkeeping changes. The looser timing bounds guard only against
order-of-magnitude regressions.

Recalibrate only after an explained query, index, PostgreSQL, or representative
data-shape change. Capture at least two unchanged runs, choose margins that pass
both without depending on an exact plan tree, and update this table and the code
in the same commit. Do not raise a bound solely to make a failing gate pass.

## Dataset

- 100,000 Coins split evenly across 10 Issuers.
- Alternating Issue Periods of 1988 and 1970, so the measured `1986-1990`
  overlap range selects exactly 50,000 Coins.
- Creation timestamps shared in groups of 1,000 Coins, making the Coin-ID
  ascending tie-breaker observable.
- 50,000 Obverse surfaces and Engraver credits distributed evenly across 10
  Engravers; the measured Engraver therefore matches 5,000 Coins.
- 50,000 contextual Ruling Authority attributions distributed evenly across 10
  global authorities; the measured authority therefore matches 5,000 Coins.
- Page size 100, the public API hard maximum.
- First, middle, and deepest non-empty pages for unfiltered, Issuer-filtered,
  Engraver-filtered, Ruling-Authority-filtered, and Issue Period overlap
  requests.

The public API assertions check status, exact `page`, `pageSize`, `totalItems`,
and `totalPages`, exactly 100 Coins, and the complete known sequence of 100 Coin
IDs for every generated page. Those IDs exercise both creation-time descending
order and Coin-ID ascending tie ordering.

## Measurements

Measured locally on PostgreSQL 17. These are single warm runs intended to compare
plans and catch order-of-magnitude regressions, not production latency targets.
The page-plan time excludes the exact-count query; API time includes the count,
page rows, page Surface images, serialization, and in-process HTTP handling.

| Path             |  Page | Baseline plan ms | Final plan ms | Baseline API ms | Final API ms |
| ---------------- | ----: | ---------------: | ------------: | --------------: | -----------: |
| Unfiltered       |     1 |           52.515 |         0.111 |          75.058 |       31.145 |
| Unfiltered       |   500 |           76.086 |        21.614 |          61.931 |       23.394 |
| Unfiltered       | 1,000 |           80.584 |        41.306 |          89.740 |       32.514 |
| Issuer           |     1 |           13.983 |         0.093 |          30.266 |        9.310 |
| Issuer           |    50 |           30.966 |         6.322 |          32.400 |       22.596 |
| Issuer           |   100 |           43.706 |         6.108 |          38.668 |       12.158 |
| Engraver         |     1 |           30.570 |         4.003 |          54.184 |       27.131 |
| Engraver         |    25 |           33.721 |        34.755 |          44.069 |       43.459 |
| Engraver         |    50 |           36.123 |        34.857 |          56.175 |       41.513 |
| Ruling Authority |     1 |                — |         1.790 |               — |       18.427 |
| Ruling Authority |    25 |                — |        17.764 |               — |       23.596 |
| Ruling Authority |    50 |                — |        19.665 |               — |       25.360 |
| Year range       |     1 |                — |         0.100 |               — |       14.560 |
| Year range       |   250 |                — |        13.237 |               — |       22.315 |
| Year range       |   500 |                — |        25.716 |               — |       29.836 |

The final plan shapes were:

- Unfiltered pages: ordered `coins_created_at_id_index` scan for first, middle,
  and deep pages.
- Issuer pages: ordered `coins_issuer_id_created_at_id_index` scan on the first
  page; PostgreSQL chose the same index as a bitmap scan plus an in-memory sort
  for the middle and deep pages.
- Engraver pages: ordered Coin index plus nested semi-joins on the first page;
  hash joins and an in-memory sort for middle and deep pages.
- Ruling Authority pages: ordered Coin and attribution indexes on the first
  page; the authority-to-Coin index plus hash joins and an in-memory sort for
  middle and deep pages.
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
