import { performance } from "node:perf_hooks"

import "@hono/zod-openapi"
import { coinListResponseSchema } from "@workspace/api"
import { createDatabase } from "@workspace/db"

import { createApp } from "./app.js"

const COIN_COUNT = 100_000
const PAGE_SIZE = 100
const PERFORMANCE_DATABASE_NAME = "coin_archive_performance"

interface ExplainPlan {
  [key: string]: unknown
  "Actual Total Time"?: number
  "Index Name"?: string
  "Node Type": string
  Plans?: Array<ExplainPlan>
  "Relation Name"?: string
  "Sort Method"?: string
}

interface ExplainOutput {
  "Execution Time": number
  Plan: ExplainPlan
  "Planning Time": number
}

interface PageScenario {
  expectedFirstId: number
  expectedLastId: number
  expectedTotalItems: number
  label: string
  offset: number
  page: number
  query: string
}

function requirePerformanceDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is required")

  const databaseName = new URL(databaseUrl).pathname.slice(1)
  if (databaseName !== PERFORMANCE_DATABASE_NAME) {
    throw new Error(
      `Refusing to replace data outside ${PERFORMANCE_DATABASE_NAME}`
    )
  }
  return databaseUrl
}

function coinId(sequence: number) {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`
}

function collectPlanNodes(plan: ExplainPlan): Array<string> {
  const details = [plan["Node Type"]]
  if (plan["Relation Name"]) details.push(`on ${plan["Relation Name"]}`)
  if (plan["Index Name"]) details.push(`using ${plan["Index Name"]}`)
  if (plan["Sort Method"]) details.push(`(${plan["Sort Method"]})`)
  return [details.join(" "), ...(plan.Plans ?? []).flatMap(collectPlanNodes)]
}

function orderedPageQuery(where = "") {
  return `
    select c.*, i.*
    from coins c
    inner join issuers i on c.issuer_id = i.id
    ${where}
    order by c.created_at desc, c.id asc
    limit ${PAGE_SIZE}
  `
}

const unfilteredQuery = orderedPageQuery()
const issuerQuery = orderedPageQuery(
  "where c.issuer_id = '10000000-0000-4000-8000-000000000001'"
)
const engraverQuery = orderedPageQuery(`
  where exists (
    select 1
    from coin_surface_engravers cse
    inner join coin_surfaces cs on cse.coin_surface_id = cs.id
    inner join engravers e on cse.engraver_id = e.id
    where cs.coin_id = c.id
      and cs.kind in ('obverse', 'reverse')
      and e.slug = 'performance-engraver-1'
  )
`)

const scenarios: Array<PageScenario> = [
  {
    expectedFirstId: 1,
    expectedLastId: 100,
    expectedTotalItems: 100_000,
    label: "unfiltered-first",
    offset: 0,
    page: 1,
    query: unfilteredQuery,
  },
  {
    expectedFirstId: 49_901,
    expectedLastId: 50_000,
    expectedTotalItems: 100_000,
    label: "unfiltered-middle",
    offset: 49_900,
    page: 500,
    query: unfilteredQuery,
  },
  {
    expectedFirstId: 99_901,
    expectedLastId: 100_000,
    expectedTotalItems: 100_000,
    label: "unfiltered-deep",
    offset: 99_900,
    page: 1_000,
    query: unfilteredQuery,
  },
  {
    expectedFirstId: 1,
    expectedLastId: 991,
    expectedTotalItems: 10_000,
    label: "issuer-first",
    offset: 0,
    page: 1,
    query: issuerQuery,
  },
  {
    expectedFirstId: 49_001,
    expectedLastId: 49_991,
    expectedTotalItems: 10_000,
    label: "issuer-middle",
    offset: 4_900,
    page: 50,
    query: issuerQuery,
  },
  {
    expectedFirstId: 99_001,
    expectedLastId: 99_991,
    expectedTotalItems: 10_000,
    label: "issuer-deep",
    offset: 9_900,
    page: 100,
    query: issuerQuery,
  },
  {
    expectedFirstId: 1,
    expectedLastId: 1_981,
    expectedTotalItems: 5_000,
    label: "engraver-first",
    offset: 0,
    page: 1,
    query: engraverQuery,
  },
  {
    expectedFirstId: 48_001,
    expectedLastId: 49_981,
    expectedTotalItems: 5_000,
    label: "engraver-middle",
    offset: 2_400,
    page: 25,
    query: engraverQuery,
  },
  {
    expectedFirstId: 98_001,
    expectedLastId: 99_981,
    expectedTotalItems: 5_000,
    label: "engraver-deep",
    offset: 4_900,
    page: 50,
    query: engraverQuery,
  },
]

function requestPath(scenario: PageScenario) {
  const query = new URLSearchParams({
    page: String(scenario.page),
    pageSize: String(PAGE_SIZE),
  })
  if (scenario.label.startsWith("issuer-")) query.set("issuer", "PERF1")
  if (scenario.label.startsWith("engraver-")) {
    query.set("engraver", "performance-engraver-1")
  }
  return `/v1/coins?${query}`
}

async function seedDataset(
  client: ReturnType<typeof createDatabase>["orm"]["$client"]
) {
  await client.query(`
    truncate coin_surface_engravers, coin_surfaces, engravers, coins, issuers cascade;

    insert into issuers (id, name, code)
    select
      ('10000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
      'Performance Issuer ' || g,
      'PERF' || g
    from generate_series(1, 10) as g;

    insert into coins (
      id, title, issuer_id, first_issue_year, last_issue_year, created_at, updated_at
    )
    select
      ('00000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
      'Performance Coin ' || g,
      ('10000000-0000-4000-8000-' || lpad((((g - 1) % 10) + 1)::text, 12, '0'))::uuid,
      2000,
      2000,
      timestamptz '2026-01-01 00:00:00+00' - (((g - 1) / 1000) * interval '1 second'),
      timestamptz '2026-01-01 00:00:00+00'
    from generate_series(1, ${COIN_COUNT}) as g;

    insert into engravers (id, slug, full_name)
    select
      ('30000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
      'performance-engraver-' || g,
      'Performance Engraver ' || g
    from generate_series(1, 10) as g;

    insert into coin_surfaces (
      id, coin_id, kind, description, created_at, updated_at
    )
    select
      ('20000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
      ('00000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
      'obverse',
      'Performance portrait',
      timestamptz '2026-01-01 00:00:00+00',
      timestamptz '2026-01-01 00:00:00+00'
    from generate_series(1, ${COIN_COUNT}, 2) as g;

    insert into coin_surface_engravers (
      coin_surface_id, engraver_id, position, created_at, updated_at
    )
    select
      ('20000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
      (
        '30000000-0000-4000-8000-' ||
        lpad(((((g - 1) / 2) % 10) + 1)::text, 12, '0')
      )::uuid,
      1,
      timestamptz '2026-01-01 00:00:00+00',
      timestamptz '2026-01-01 00:00:00+00'
    from generate_series(1, ${COIN_COUNT}, 2) as g;

    analyze;
  `)
}

async function main() {
  const database = createDatabase(requirePerformanceDatabaseUrl(), {
    statementTimeoutMillis: 60_000,
  })
  try {
    await seedDataset(database.orm.$client)
    const app = createApp({
      allowedOrigins: [],
      checkReadiness: database.checkReadiness,
      findCoinById: database.findCoinById,
      listCoins: database.listCoins,
      listEngravers: database.listEngravers,
      listIssuers: database.listIssuers,
      log: () => undefined,
    })

    const measurements = []
    for (const scenario of scenarios) {
      const explained = await database.orm.$client.query<{
        "QUERY PLAN": Array<ExplainOutput>
      }>(
        `explain (analyze, buffers, format json) ${scenario.query} offset ${scenario.offset}`
      )
      const explain = explained.rows.at(0)?.["QUERY PLAN"].at(0)
      if (!explain) throw new Error(`Missing query plan for ${scenario.label}`)

      const startedAt = performance.now()
      const response = await app.request(requestPath(scenario))
      const durationMs = performance.now() - startedAt
      if (!response.ok) {
        throw new Error(`${scenario.label} returned HTTP ${response.status}`)
      }
      const page = coinListResponseSchema.parse(await response.json())
      const expectedTotalPages = Math.ceil(
        scenario.expectedTotalItems / PAGE_SIZE
      )
      const firstCoin = page.coins.at(0)
      const lastCoin = page.coins.at(-1)
      if (
        page.coins.length !== PAGE_SIZE ||
        page.pagination.page !== scenario.page ||
        page.pagination.pageSize !== PAGE_SIZE ||
        page.pagination.totalItems !== scenario.expectedTotalItems ||
        page.pagination.totalPages !== expectedTotalPages ||
        firstCoin?.id !== coinId(scenario.expectedFirstId) ||
        lastCoin?.id !== coinId(scenario.expectedLastId)
      ) {
        throw new Error(`Unexpected public API page for ${scenario.label}`)
      }

      measurements.push({
        apiDurationMs: Number(durationMs.toFixed(3)),
        executionMs: explain["Execution Time"],
        label: scenario.label,
        planNodes: collectPlanNodes(explain.Plan),
        planningMs: explain["Planning Time"],
      })
    }

    console.log(
      JSON.stringify(
        {
          dataset: {
            coins: COIN_COUNT,
            engraverCredits: 50_000,
            engravers: 10,
            issuers: 10,
            pageSize: PAGE_SIZE,
            surfaces: 50_000,
          },
          measurements,
        },
        null,
        2
      )
    )
  } finally {
    await database.close()
  }
}

await main()
