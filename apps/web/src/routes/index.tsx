import { createFileRoute, getRouteApi } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getCoins } from "@workspace/db"
import {
  coinListInputSchema,
  coinSearchSchema,
  getCoinListLoaderDeps,
  hasActiveCoinSearchFilters,
  updateCoinSearchFilter,
} from "../lib/coin-search"

import { HomeFilters } from "@/components/home-filters"
import { CoinCard } from "@/components/coin-card"
import { EmptyState } from "@/components/home/empty-state"

const getCoinListData = createServerFn({ method: "GET" })
  .inputValidator(coinListInputSchema)
  .handler(async ({ data }) => ({ coins: await getCoins(data) }))

const rootRouteApi = getRouteApi("__root__")

export const Route = createFileRoute("/")({
  validateSearch: coinSearchSchema,
  loaderDeps: ({ search }) => getCoinListLoaderDeps(search),
  loader: ({ deps }) => getCoinListData({ data: deps }),
  component: App,
})

function App() {
  const { coins } = Route.useLoaderData()
  const filterOptions = rootRouteApi.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  async function updateHomeFilters({
    distributionCode,
    engraverCode,
    issuerCode,
    themeCode,
  }: {
    distributionCode: string | undefined
    engraverCode: string | undefined
    issuerCode: string | undefined
    themeCode: string | undefined
  }) {
    await navigate({
      resetScroll: false,
      search: (currentSearch) => {
        const searchWithDistribution = updateCoinSearchFilter(
          currentSearch,
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

        return updateCoinSearchFilter(searchWithIssuer, "theme", themeCode)
      },
    })
  }

  return (
    <div className="flex h-full flex-1 flex-col p-6">
      <HomeFilters
        distributions={filterOptions.distributions}
        engravers={filterOptions.engravers}
        issuers={filterOptions.issuers}
        themes={filterOptions.themes}
        selectedDistributionCode={search.distribution}
        selectedEngraverCode={search.engraver}
        selectedIssuerCode={search.issuer}
        selectedThemeCode={search.theme}
        onFiltersChange={updateHomeFilters}
      />

      {coins.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveCoinSearchFilters(search)} />
      ) : (
        <div className="grid h-full w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 [@media(min-width:1920px)]:[grid-template-columns:repeat(auto-fit,minmax(0,290px))]">
          {coins.map((coin) => (
            <CoinCard coin={coin} key={coin.id} search={search} />
          ))}
        </div>
      )}
    </div>
  )
}
