import { createFileRoute, getRouteApi } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  coinListInputSchema,
  coinSearchSchema,
  getCoinListLoaderDeps,
} from "../lib/coin-search"
import { jsonInspectorMetadata } from "../lib/json-inspector-metadata"
import type { JsonInspectorQueryKey } from "../lib/json-inspector-metadata"
import type { JsonInspectorQueries } from "../lib/json-inspector-queries"

const coinJsonLimit = 1_000

const getJsonQueryData = createServerFn({ method: "GET" })
  .inputValidator(coinListInputSchema)
  .handler(async ({ data }) => {
    const { getCoins } = await import("@workspace/db")

    const coins = await getCoins({
      limit: coinJsonLimit + 1,
      ...data,
    })
    const isTruncated = coins.length > coinJsonLimit

    return {
      activeCoinFilters: data,
      coins: isTruncated ? coins.slice(0, coinJsonLimit) : coins,
      coinLimit: coinJsonLimit,
      isTruncated,
    }
  })

const rootRouteApi = getRouteApi("__root__")

export const Route = createFileRoute("/json")({
  validateSearch: coinSearchSchema,
  loaderDeps: ({ search }) => getCoinListLoaderDeps(search),
  loader: ({ deps }) => getJsonQueryData({ data: deps }),
  component: RouteComponent,
})

function RouteComponent() {
  const { activeCoinFilters, coins, coinLimit, isTruncated } =
    Route.useLoaderData()
  const filterOptions = rootRouteApi.useLoaderData()
  const queries = {
    coins,
    issuers: filterOptions.issuers,
    rulers: filterOptions.rulers,
    catalogues: filterOptions.catalogues,
    compositions: filterOptions.compositions,
    currencies: filterOptions.currencies,
    distributions: filterOptions.distributions,
    edges: filterOptions.edges,
    engravers: filterOptions.engravers,
    mints: filterOptions.mints,
    orientations: filterOptions.orientations,
    rims: filterOptions.rims,
    shapes: filterOptions.shapes,
    techniques: filterOptions.techniques,
    themes: filterOptions.themes,
  } satisfies JsonInspectorQueries
  const queryEntries = Object.entries(queries).sort(([left], [right]) => {
    if (left === "coins") {
      return -1
    }

    if (right === "coins") {
      return 1
    }

    return left.localeCompare(right)
  })

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Database JSON inspector</h1>
        <p className="text-sm text-muted-foreground">
          Raw output for every current DB query. The <code>coins</code> section
          uses the same search params as the home page, but is capped at{" "}
          <code>{coinLimit}</code> rows to keep the payload bounded.
        </p>
        {isTruncated ? (
          <p className="text-sm text-amber-700">
            Showing the first <code>{coinLimit}</code> matching coins. Narrow
            the filters to inspect the rest.
          </p>
        ) : null}
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Active coin filters</h2>
        <JsonBlock value={activeCoinFilters} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Queries</h2>
        <Tabs
          defaultValue={queryEntries[0]?.[0] ?? "coins"}
          className="gap-4 rounded-lg border border-border/60 p-4"
        >
          <TabsList
            variant="line"
            className="w-full justify-start overflow-x-auto whitespace-nowrap"
          >
            {queryEntries.map(([queryName, value]) => (
              <TabsTrigger key={queryName} value={queryName}>
                {queryName} ({getResultCount(value)})
                {queryName === "coins" && isTruncated ? "+" : ""}
              </TabsTrigger>
            ))}
          </TabsList>

          {queryEntries.map(([queryName, value]) => (
            <TabsContent
              key={queryName}
              value={queryName}
              className="space-y-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-medium">{queryName}</h3>
                <span className="text-sm text-muted-foreground">
                  {getResultCountLabel({
                    isTruncated: queryName === "coins" && isTruncated,
                    limit: queryName === "coins" ? coinLimit : undefined,
                    value,
                  })}
                </span>
              </div>
              <QueryMetadataPanel
                metadata={
                  jsonInspectorMetadata[queryName as JsonInspectorQueryKey]
                }
              />
              <JsonBlock value={value} />
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </main>
  )
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 text-xs leading-6">
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  )
}

function QueryMetadataPanel({
  metadata,
}: {
  metadata: (typeof jsonInspectorMetadata)[JsonInspectorQueryKey]
}) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <MetadataCard title="Database tables" items={metadata.databaseTables} />
      <MetadataCard title="Requirements" items={metadata.requirements} />
      <MetadataCard title="Limitations" items={metadata.limitations} />
      <div className="md:col-span-3">
        <MetadataCard title="Query notes" items={metadata.queryNotes} />
      </div>
    </section>
  )
}

function MetadataCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-4">
      <h4 className="text-sm font-medium">{title}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground marker:text-foreground/60">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function getResultCountLabel({
  isTruncated,
  limit,
  value,
}: {
  isTruncated: boolean
  limit?: number
  value: unknown
}) {
  if (Array.isArray(value)) {
    if (isTruncated && typeof limit === "number") {
      return `${value.length} records shown (limited to ${limit})`
    }

    return `${value.length} record${value.length === 1 ? "" : "s"}`
  }

  return "non-list result"
}

function getResultCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0
}
