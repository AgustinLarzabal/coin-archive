import { performance } from "node:perf_hooks"

import "@hono/zod-openapi"
import { coinListResponseSchema } from "@workspace/api"
import { createDatabase } from "@workspace/db"

import { createApp } from "./app.js"
import { analyzePaginationPlan } from "./coin-pagination-plan-analysis.js"
import type {
  ExplainOutput,
  ExplainPlan,
  PlanExpectation,
  PlanViolation,
} from "./coin-pagination-plan-analysis.js"

const COIN_COUNT = 100_000
const PAGE_SIZE = 100
const PERFORMANCE_DATABASE_NAME = "coin_archive_performance"

interface PageScenario {
  expectedFirstId: number
  expectedIdStep: number
  expectedTotalItems: number
  filter:
    | { kind: "engraver"; slug: string }
    | { code: string; kind: "issuer" }
    | { kind: "ruler"; slug: string }
    | { kind: "year"; year: string }
    | { kind: "none" }
  label: string
  page: number
  planExpectation: Omit<PlanExpectation, "label">
}

interface LoggedQuery {
  params: Array<unknown>
  query: string
}

const durationLimits = {
  maxApiDurationMs: 1_000,
  maxExecutionMs: 500,
}

function orderedPlanExpectation({
  index,
  maxPlanRows,
  maxRowsRemovedByFilter,
  maxSharedBlocks,
}: {
  index: string
  maxPlanRows: number
  maxRowsRemovedByFilter: number
  maxSharedBlocks: number
}): Omit<PlanExpectation, "label"> {
  return {
    ...durationLimits,
    forbiddenSequentialScanRelations: ["coins"],
    maxPlanRows,
    maxReturnedRows: PAGE_SIZE,
    maxRowsRemovedByFilter,
    maxSharedBlocks,
    maxSortRows: 0,
    requiredIndexes: [index],
  }
}

function sortedPlanExpectation({
  forbiddenSequentialScanRelations = [],
  maxPlanRows,
  maxSharedBlocks,
  maxSortRows,
  requiredIndexes = [],
}: {
  forbiddenSequentialScanRelations?: Array<string>
  maxPlanRows: number
  maxSharedBlocks: number
  maxSortRows: number
  requiredIndexes?: Array<string>
}): Omit<PlanExpectation, "label"> {
  return {
    ...durationLimits,
    forbiddenSequentialScanRelations,
    maxPlanRows,
    maxReturnedRows: PAGE_SIZE,
    maxRowsRemovedByFilter: 100,
    maxSharedBlocks,
    maxSortRows,
    requiredIndexes,
  }
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

const scenarios: Array<PageScenario> = [
  {
    expectedFirstId: 1,
    expectedIdStep: 1,
    expectedTotalItems: 100_000,
    filter: { kind: "none" },
    label: "unfiltered-first",
    page: 1,
    planExpectation: orderedPlanExpectation({
      index: "coins_created_at_id_index",
      maxPlanRows: 1_000,
      maxRowsRemovedByFilter: 100,
      maxSharedBlocks: 500,
    }),
  },
  {
    expectedFirstId: 49_901,
    expectedIdStep: 1,
    expectedTotalItems: 100_000,
    filter: { kind: "none" },
    label: "unfiltered-middle",
    page: 500,
    planExpectation: orderedPlanExpectation({
      index: "coins_created_at_id_index",
      maxPlanRows: 250_000,
      maxRowsRemovedByFilter: 100,
      maxSharedBlocks: 5_000,
    }),
  },
  {
    expectedFirstId: 99_901,
    expectedIdStep: 1,
    expectedTotalItems: 100_000,
    filter: { kind: "none" },
    label: "unfiltered-deep",
    page: 1_000,
    planExpectation: orderedPlanExpectation({
      index: "coins_created_at_id_index",
      maxPlanRows: 500_000,
      maxRowsRemovedByFilter: 100,
      maxSharedBlocks: 10_000,
    }),
  },
  {
    expectedFirstId: 1,
    expectedIdStep: 10,
    expectedTotalItems: 10_000,
    filter: { code: "PERF1", kind: "issuer" },
    label: "issuer-first",
    page: 1,
    planExpectation: orderedPlanExpectation({
      index: "coins_issuer_id_created_at_id_index",
      maxPlanRows: 1_000,
      maxRowsRemovedByFilter: 100,
      maxSharedBlocks: 500,
    }),
  },
  {
    expectedFirstId: 49_001,
    expectedIdStep: 10,
    expectedTotalItems: 10_000,
    filter: { code: "PERF1", kind: "issuer" },
    label: "issuer-middle",
    page: 50,
    planExpectation: sortedPlanExpectation({
      forbiddenSequentialScanRelations: ["coins"],
      maxPlanRows: 75_000,
      maxSharedBlocks: 5_000,
      maxSortRows: 10_000,
      requiredIndexes: ["coins_issuer_id_created_at_id_index"],
    }),
  },
  {
    expectedFirstId: 99_001,
    expectedIdStep: 10,
    expectedTotalItems: 10_000,
    filter: { code: "PERF1", kind: "issuer" },
    label: "issuer-deep",
    page: 100,
    planExpectation: sortedPlanExpectation({
      forbiddenSequentialScanRelations: ["coins"],
      maxPlanRows: 75_000,
      maxSharedBlocks: 5_000,
      maxSortRows: 10_000,
      requiredIndexes: ["coins_issuer_id_created_at_id_index"],
    }),
  },
  {
    expectedFirstId: 1,
    expectedIdStep: 20,
    expectedTotalItems: 5_000,
    filter: { kind: "engraver", slug: "performance-engraver-1" },
    label: "engraver-first",
    page: 1,
    planExpectation: orderedPlanExpectation({
      index: "coins_created_at_id_index",
      maxPlanRows: 30_000,
      maxRowsRemovedByFilter: 5_000,
      maxSharedBlocks: 30_000,
    }),
  },
  {
    expectedFirstId: 48_001,
    expectedIdStep: 20,
    expectedTotalItems: 5_000,
    filter: { kind: "engraver", slug: "performance-engraver-1" },
    label: "engraver-middle",
    page: 25,
    planExpectation: sortedPlanExpectation({
      maxPlanRows: 500_000,
      maxSharedBlocks: 10_000,
      maxSortRows: 5_000,
    }),
  },
  {
    expectedFirstId: 98_001,
    expectedIdStep: 20,
    expectedTotalItems: 5_000,
    filter: { kind: "engraver", slug: "performance-engraver-1" },
    label: "engraver-deep",
    page: 50,
    planExpectation: sortedPlanExpectation({
      maxPlanRows: 500_000,
      maxSharedBlocks: 10_000,
      maxSortRows: 5_000,
    }),
  },
  {
    expectedFirstId: 1,
    expectedIdStep: 20,
    expectedTotalItems: 5_000,
    filter: { kind: "ruler", slug: "performance-authority-1" },
    label: "ruler-first",
    page: 1,
    planExpectation: orderedPlanExpectation({
      index: "coins_created_at_id_index",
      maxPlanRows: 30_000,
      maxRowsRemovedByFilter: 5_000,
      maxSharedBlocks: 30_000,
    }),
  },
  {
    expectedFirstId: 48_001,
    expectedIdStep: 20,
    expectedTotalItems: 5_000,
    filter: { kind: "ruler", slug: "performance-authority-1" },
    label: "ruler-middle",
    page: 25,
    planExpectation: sortedPlanExpectation({
      maxPlanRows: 500_000,
      maxSharedBlocks: 10_000,
      maxSortRows: 5_000,
      requiredIndexes: ["coin_ruling_authorities_authority_coin_index"],
    }),
  },
  {
    expectedFirstId: 98_001,
    expectedIdStep: 20,
    expectedTotalItems: 5_000,
    filter: { kind: "ruler", slug: "performance-authority-1" },
    label: "ruler-deep",
    page: 50,
    planExpectation: sortedPlanExpectation({
      maxPlanRows: 500_000,
      maxSharedBlocks: 10_000,
      maxSortRows: 5_000,
      requiredIndexes: ["coin_ruling_authorities_authority_coin_index"],
    }),
  },
  {
    expectedFirstId: 1,
    expectedIdStep: 2,
    expectedTotalItems: 50_000,
    filter: { kind: "year", year: "1986-1990" },
    label: "year-range-first",
    page: 1,
    planExpectation: orderedPlanExpectation({
      index: "coins_created_at_id_index",
      maxPlanRows: 1_000,
      maxRowsRemovedByFilter: 500,
      maxSharedBlocks: 500,
    }),
  },
  {
    expectedFirstId: 49_801,
    expectedIdStep: 2,
    expectedTotalItems: 50_000,
    filter: { kind: "year", year: "1986-1990" },
    label: "year-range-middle",
    page: 250,
    planExpectation: orderedPlanExpectation({
      index: "coins_created_at_id_index",
      maxPlanRows: 150_000,
      maxRowsRemovedByFilter: 75_000,
      maxSharedBlocks: 5_000,
    }),
  },
  {
    expectedFirstId: 99_801,
    expectedIdStep: 2,
    expectedTotalItems: 50_000,
    filter: { kind: "year", year: "1986-1990" },
    label: "year-range-deep",
    page: 500,
    planExpectation: orderedPlanExpectation({
      index: "coins_created_at_id_index",
      maxPlanRows: 300_000,
      maxRowsRemovedByFilter: 150_000,
      maxSharedBlocks: 10_000,
    }),
  },
]

function requestPath(scenario: PageScenario) {
  const query = new URLSearchParams({
    page: String(scenario.page),
    pageSize: String(PAGE_SIZE),
  })
  if (scenario.filter.kind === "issuer") {
    query.set("issuer", scenario.filter.code)
  }
  if (scenario.filter.kind === "engraver") {
    query.set("engraver", scenario.filter.slug)
  }
  if (scenario.filter.kind === "ruler") {
    query.set("ruler", scenario.filter.slug)
  }
  if (scenario.filter.kind === "year") {
    query.set("year", scenario.filter.year)
  }
  return `/v1/coins?${query}`
}

async function seedDataset(
  client: ReturnType<typeof createDatabase>["orm"]["$client"]
) {
  await client.query(`
    truncate coin_ruling_authorities, ruling_authorities, coin_surface_engravers, coin_surfaces, engravers, coins, issuers cascade;

    insert into issuers (id, name, code)
    select
      ('10000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
      'Performance Issuer ' || g,
      'PERF' || g
    from generate_series(1, 10) as g;

    insert into coins (
      id, title, issuer_id, distribution, first_issue_year, last_issue_year, created_at, updated_at
    )
    select
      ('00000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
      'Performance Coin ' || g,
      ('10000000-0000-4000-8000-' || lpad((((g - 1) % 10) + 1)::text, 12, '0'))::uuid,
      'circulating-commemorative',
      case when g % 2 = 1 then 1988 else 1970 end,
      case when g % 2 = 1 then 1988 else 1970 end,
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

    insert into ruling_authorities (id, slug, name)
    select
      ('40000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
      'performance-authority-' || g,
      'Performance Authority ' || g
    from generate_series(1, 10) as g;

    insert into coin_ruling_authorities (
      coin_id, ruling_authority_id, role, position
    )
    select
      ('00000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
      (
        '40000000-0000-4000-8000-' ||
        lpad(((((g - 1) / 2) % 10) + 1)::text, 12, '0')
      )::uuid,
      'Performance Role',
      1
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
  const loggedQueries: Array<LoggedQuery> = []
  const database = createDatabase(requirePerformanceDatabaseUrl(), {
    onQuery: (query, params) => loggedQueries.push({ params, query }),
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
      listRulingAuthorities: database.listRulingAuthorities,
      log: () => undefined,
    })

    const measurements = []
    const violations: Array<PlanViolation> = []
    for (const scenario of scenarios) {
      loggedQueries.length = 0
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
      const expectedCoinIds = Array.from({ length: PAGE_SIZE }, (_, index) =>
        coinId(scenario.expectedFirstId + index * scenario.expectedIdStep)
      )
      if (
        page.coins.length !== PAGE_SIZE ||
        page.pagination.page !== scenario.page ||
        page.pagination.pageSize !== PAGE_SIZE ||
        page.pagination.totalItems !== scenario.expectedTotalItems ||
        page.pagination.totalPages !== expectedTotalPages ||
        page.coins.some((coin, index) => coin.id !== expectedCoinIds[index])
      ) {
        throw new Error(`Unexpected public API page for ${scenario.label}`)
      }

      const pageQuery = loggedQueries.find(({ query }) =>
        /order by .*"created_at" desc, .*"id" asc/.test(query)
      )
      if (!pageQuery) {
        throw new Error(`Missing emitted page query for ${scenario.label}`)
      }
      const explained = await database.orm.$client.query<{
        "QUERY PLAN": Array<ExplainOutput>
      }>(
        `explain (analyze, buffers, format json) ${pageQuery.query}`,
        pageQuery.params
      )
      const explain = explained.rows.at(0)?.["QUERY PLAN"].at(0)
      if (!explain) throw new Error(`Missing query plan for ${scenario.label}`)
      const analysis = analyzePaginationPlan({
        apiDurationMs: durationMs,
        expectation: {
          ...scenario.planExpectation,
          label: scenario.label,
        },
        explain,
      })
      violations.push(...analysis.violations)

      measurements.push({
        apiDurationMs: Number(durationMs.toFixed(3)),
        executionMs: explain["Execution Time"],
        label: scenario.label,
        planNodes: collectPlanNodes(explain.Plan),
        planWork: analysis.summary,
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
            rulingAuthorities: 10,
            rulingAuthorityAttributions: 50_000,
            pageSize: PAGE_SIZE,
            surfaces: 50_000,
          },
          measurements,
        },
        null,
        2
      )
    )
    if (violations.length > 0) {
      console.error("Pagination performance gate failed:")
      for (const violation of violations) {
        console.error(
          `- ${violation.label}: ${violation.metric} was ${violation.actual}; bound ${violation.bound}`
        )
      }
      throw new Error(
        `Pagination performance gate found ${violations.length} violation(s)`
      )
    }
    console.log(
      `Pagination performance gate passed (${scenarios.length} scenarios)`
    )
  } finally {
    await database.close()
  }
}

await main()
