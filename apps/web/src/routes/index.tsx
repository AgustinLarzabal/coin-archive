import { createFileRoute, getRouteApi } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getCoins } from "@workspace/db"
import {
  coinListInputSchema,
  coinSearchSchema,
  getCoinListLoaderDeps,
} from "../lib/coin-search"

import { HomeFilters } from "@/components/home-filters"
import { CoinCard } from "@/components/coin-card"

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
    issuerCode,
  }: {
    issuerCode: string | undefined
  }) {
    await navigate({
      resetScroll: false,
      search: issuerCode ? { issuer: issuerCode } : {},
    })
  }

  return (
    <div className="p-6">
      <HomeFilters
        issuers={filterOptions.issuers}
        selectedIssuerCode={search.issuer}
        onFiltersChange={updateHomeFilters}
      />

      <div className="grid grid-cols-5 gap-6">
        {coins.map((coin) => (
          <CoinCard coin={coin} key={coin.id} />
        ))}
      </div>
    </div>
  )
}
