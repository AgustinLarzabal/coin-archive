# Explore filter load, staging

## Environment and method

- Measured revision: `9862dad767a645f76729671c4331509161fcc894` (`9862dad`). The successful staging release for this SHA started at 2026-11-25 18:38:17 UTC; the current web deployment was created at 18:40:13 UTC. The deployed revision therefore matches the measured revision.
- Host: `coin-archive-web-staging.coinarchive.workers.dev` (Madrid client, headless Brave).
- Sample window: 2026-11-25 21:40:18–21:43:45 UTC. The third complete pair replaced an earlier pair whose Worker tail output was incomplete.
- Each cold visit used a fresh browser context. Cold starts were more than 30 seconds apart. Each warm visit immediately reloaded the same page in its context. Time is navigation start to the visible **Explore filters** navigation. All six document responses were HTTP 200 and all six displayed the filters.
- Web and API Worker tails ran during the visits. Events were grouped by their timestamps and the staging request path. `archive_backend` counts web-to-API calls, including the Coin list. API request-log counts below cover only the eleven reference paths. A cache hit bypasses the API request log. These counts are not PostgreSQL query counts.

## Observations

| Pair | Cold start (UTC) | Cold to filters | Cold `archive_backend` | Cold API request logs | Warm start (UTC) | Warm to filters | Warm `archive_backend` | Warm API request logs |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 1 | 21:40:18.656 | 714 ms | 12 | 11 | 21:40:19.370 | 131 ms | 12 | 0 |
| 2 | 21:40:50.645 | 502 ms | 12 | 11 | 21:40:51.147 | 170 ms | 12 | 0 |
| 3 | 21:43:44.061 | 512 ms | 12 | 11 | 21:43:44.573 | 192 ms | 12 | 0 |

Cold median: **512 ms**; cold max: **714 ms**. Warm median: **170 ms**; warm max: **192 ms**. The median gap is 342 ms. Cold web `archive_backend` durations ranged from 46 to 337 ms across the three complete pairs; warm durations ranged from 5 to 14 ms. The eleven logged API reference requests per cold visit completed in 39–112 ms each. All observed Worker events had status 200.

## Decision

**No change.** The cold-to-warm gap is a material share of the measured wait (342 ms, about 67% of the cold median), and each cold visit caused eleven API cache misses and backend executions. However, the entire cold wait stayed below 714 ms in this small staging sample. The parallel API reference requests each completed within 112 ms. The web tail also includes the Coin request, so the gap cannot be assigned wholly to filters; the API logs do not quantify database work. This evidence does not justify changing the request contract or cache yet. Re-measure if production traffic or user timings show a larger wait or database load.
