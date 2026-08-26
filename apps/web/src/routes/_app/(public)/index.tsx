import { Await, Link, createFileRoute, defer } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {
  getDistributions,
  getEngravers,
  getIssuers,
  getRulers,
  getThemes,
} from "@coin-archive/db"
import {
  coinListInputSchema,
  coinSearchSchema,
  getCoinListLoaderDeps,
  hasActiveCoinSearchFilters,
  updateCoinSearchFilter,
} from "../../../lib/coin-search"
import { HomeFilters } from "@/components/home-filters"
import { CoinCard } from "@/components/coin-card"
import { EmptyState } from "@/components/home/empty-state"
import { Button } from "@coin-archive/ui/components/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@coin-archive/ui/components/card"
import { Input } from "@coin-archive/ui/components/input"
import { Skeleton } from "@coin-archive/ui/components/skeleton"

const getCoinListData = createServerFn({ method: "GET" })
  .inputValidator(coinListInputSchema)
  .handler(async ({ data }) => {
    const { getPublicCoinList } = await import("./-coin-list.server")
    return getPublicCoinList(data)
  })

const getCoinFilterOptions = createServerFn({ method: "GET" }).handler(
  async () => {
    const [distributions, engravers, issuers, rulers, themes] =
      await Promise.all([
        getDistributions(),
        getEngravers(),
        getIssuers(),
        getRulers(),
        getThemes(),
      ])

    return {
      distributions,
      engravers,
      issuers,
      rulers,
      themes,
    }
  }
)

export const Route = createFileRoute("/_app/(public)/")({
  validateSearch: coinSearchSchema,
  loaderDeps: ({ search }) => getCoinListLoaderDeps(search),
  loader: async ({ deps }) => {
    return {
      coinListData: defer(getCoinListData({ data: deps })),
      filterOptions: await getCoinFilterOptions(),
    }
  },
  component: App,
})

function CoinCardsSkeleton() {
  return (
    <>
      <div className="mb-10 flex flex-col gap-4">
        <Skeleton className="h-9 w-28" />
        <div className="flex w-full max-w-xl gap-2">
          <Skeleton className="h-9 grow" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
      <div className="grid h-full w-full [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))] gap-6">
        {Array.from({ length: 8 }, (_, index) => (
          <Card className="h-full p-0 pb-4" key={index}>
            <CardContent className="p-2">
              <Skeleton className="h-60 w-full" />
            </CardContent>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardFooter className="mt-auto">
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  )
}

function App() {
  const { coinListData, filterOptions } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  async function updateCoinTitleSearch(formData: FormData) {
    const q = formData.get("q")

    await navigate({
      resetScroll: false,
      search: (currentSearch) => {
        const searchWithoutCursor = updateCoinSearchFilter(
          currentSearch,
          "cursor",
          undefined
        )

        return updateCoinSearchFilter(
          searchWithoutCursor,
          "q",
          typeof q === "string" ? q : undefined
        )
      },
    })
  }

  async function updateHomeFilters({
    distributionCode,
    engraverCode,
    issuerCode,
    rulerCode,
    themeCode,
  }: {
    distributionCode: string | undefined
    engraverCode: string | undefined
    issuerCode: string | undefined
    rulerCode: string | undefined
    themeCode: string | undefined
  }) {
    await navigate({
      resetScroll: false,
      search: (currentSearch) => {
        const searchWithoutCursor = updateCoinSearchFilter(
          currentSearch,
          "cursor",
          undefined
        )
        const searchWithDistribution = updateCoinSearchFilter(
          searchWithoutCursor,
          "distribution",
          distributionCode
        )

        const searchWithEngraver = updateCoinSearchFilter(
          searchWithDistribution,
          "engraver",
          engraverCode
        )

        const searchWithIssuer = updateCoinSearchFilter(
          searchWithEngraver,
          "issuer",
          issuerCode
        )

        const searchWithRuler = updateCoinSearchFilter(
          searchWithIssuer,
          "ruler",
          rulerCode
        )

        return updateCoinSearchFilter(searchWithRuler, "theme", themeCode)
      },
    })
  }

  return (
    <Await fallback={<CoinCardsSkeleton />} promise={coinListData}>
      {({ coins, nextCursor }) => (
        <>
          {coins.length > 0 ? (
            <div className="mb-10 flex flex-col gap-4">
              <HomeFilters
                distributions={filterOptions.distributions}
                engravers={filterOptions.engravers}
                issuers={filterOptions.issuers}
                rulers={filterOptions.rulers}
                themes={filterOptions.themes}
                selectedDistributionCode={search.distribution}
                selectedEngraverCode={search.engraver}
                selectedIssuerCode={search.issuer}
                selectedRulerCode={search.ruler}
                selectedThemeCode={search.theme}
                onFiltersChange={updateHomeFilters}
              />
              <form
                action={updateCoinTitleSearch}
                className="flex w-full max-w-xl gap-2"
              >
                <Input
                  type="search"
                  name="q"
                  defaultValue={search.q ?? ""}
                  placeholder="Search Coin Titles"
                />
                <Button type="submit">Search</Button>
              </form>
            </div>
          ) : null}

          {coins.length === 0 ? (
            <EmptyState hasActiveFilters={hasActiveCoinSearchFilters(search)} />
          ) : (
            <div className="grid h-full w-full [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))] gap-6">
              {coins.map((coin) => (
                <CoinCard coin={coin} key={coin.id} search={search} />
              ))}
            </div>
          )}

          {nextCursor === null ? null : (
            <Link
              to="/"
              search={{ ...search, cursor: nextCursor }}
              className="mt-6 self-center"
            >
              Next page
            </Link>
          )}
        </>
      )}
    </Await>
  )
}
