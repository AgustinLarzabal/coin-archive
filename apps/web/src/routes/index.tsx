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
    engraverCode,
    issuerCode,
  }: {
    engraverCode: string | undefined
    issuerCode: string | undefined
  }) {
    await navigate({
      resetScroll: false,
      search: (currentSearch) => {
        const searchWithEngraver = updateCoinSearchFilter(
          currentSearch,
          "engraver",
          engraverCode
        )

        return updateCoinSearchFilter(searchWithEngraver, "issuer", issuerCode)
      },
    })
  }

  return (
    <div className="flex h-full flex-1 flex-col p-6">
      <HomeFilters
        engravers={filterOptions.engravers}
        issuers={filterOptions.issuers}
        selectedEngraverCode={search.engraver}
        selectedIssuerCode={search.issuer}
        onFiltersChange={updateHomeFilters}
      />

      {coins.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveCoinSearchFilters(search)} />
      ) : (
        <div className="grid h-full w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 [@media(min-width:1920px)]:[grid-template-columns:repeat(auto-fit,minmax(0,290px))]">
          {coins.map((coin) => (
            <CoinCard coin={coin} key={coin.id} />
          ))}
        </div>
      )}
    </div>
  )
}
