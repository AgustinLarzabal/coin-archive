import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { coinSearchSchema, getCoinListLoaderDeps } from "../lib/coin-search"

const fullCoinJsonLimit = 2_147_483_647

const getJsonQueryData = createServerFn({ method: "GET" })
  .inputValidator(coinSearchSchema)
  .handler(async ({ data }) => {
    const {
      getCatalogues,
      getCoins,
      getCompositions,
      getCurrencies,
      getDistributions,
      getEdges,
      getEngravers,
      getIssuers,
      getMints,
      getOrientations,
      getRims,
      getRulers,
      getShapes,
      getTechniques,
      getThemes,
    } = await import("@workspace/db")

    const coinFilters = getCoinListLoaderDeps(data)
    const [
      catalogues,
      coins,
      compositions,
      currencies,
      distributions,
      edges,
      engravers,
      issuers,
      mints,
      orientations,
      rims,
      rulers,
      shapes,
      techniques,
      themes,
    ] = await Promise.all([
      getCatalogues(),
      getCoins({
        limit: fullCoinJsonLimit,
        ...coinFilters,
      }),
      getCompositions(),
      getCurrencies(),
      getDistributions(),
      getEdges(),
      getEngravers(),
      getIssuers(),
      getMints(),
      getOrientations(),
      getRims(),
      getRulers(),
      getShapes(),
      getTechniques(),
      getThemes(),
    ])

    return {
      activeCoinFilters: coinFilters,
      queries: {
        coins,
        issuers,
        rulers,
        catalogues,
        compositions,
        currencies,
        distributions,
        edges,
        engravers,
        mints,
        orientations,
        rims,
        shapes,
        techniques,
        themes,
      },
    }
  })

export const Route = createFileRoute("/json")({
  validateSearch: coinSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getJsonQueryData({ data: deps }),
  component: RouteComponent,
})

function RouteComponent() {
  const { activeCoinFilters, queries } = Route.useLoaderData()
  const queryEntries = Object.entries(queries)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Database JSON inspector</h1>
        <p className="text-sm text-muted-foreground">
          Raw output for every current DB query. The <code>coins</code> section
          uses the same search params as the home page, but removes the default
          10-row limit.
        </p>
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
              </TabsTrigger>
            ))}
          </TabsList>

          {queryEntries.map(([queryName, value]) => (
            <TabsContent key={queryName} value={queryName} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-medium">{queryName}</h3>
                <span className="text-sm text-muted-foreground">
                  {getResultCountLabel(value)}
                </span>
              </div>
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

function getResultCountLabel(value: unknown) {
  if (Array.isArray(value)) {
    return `${value.length} record${value.length === 1 ? "" : "s"}`
  }

  return "non-list result"
}

function getResultCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0
}
