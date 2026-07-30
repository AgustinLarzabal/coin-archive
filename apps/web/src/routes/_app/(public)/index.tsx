import { Link, createFileRoute } from "@tanstack/react-router"
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
  type CoinListLoaderDeps,
  getCoinListLoaderDeps,
  hasActiveCoinSearchFilters,
  updateCoinSearchFilter,
} from "../../../lib/coin-search"
import { HomeFilters } from "@/components/home-filters"
import { CoinCard } from "@/components/coin-card"
import { EmptyState } from "@/components/home/empty-state"
import { getPublicApiClient } from "@/lib/public-api.server"
import { Button } from "@coin-archive/ui/components/button"
import { Input } from "@coin-archive/ui/components/input"

export async function getPublicCoinList(data: CoinListLoaderDeps) {
  const response = await getPublicApiClient().coins.browse({
    cursor: data.cursor,
    distribution: data.distributionCode,
    engraver: data.engraverCode,
    issuer: data.issuerCode,
    q: data.q,
    ruler: data.rulerCode,
    theme: data.themeCode,
  })
  return {
    coins: response.data.map((coin) => ({
      id: coin.id,
      title: coin.title,
      issuer: coin.issuer,
      surfaces: {
        obverse:
          coin.surfaceImages.obverse === null
            ? null
            : {
                description: null,
                lettering: null,
                imageUrl: coin.surfaceImages.obverse,
                engravers: [],
              },
        reverse:
          coin.surfaceImages.reverse === null
            ? null
            : {
                description: null,
                lettering: null,
                imageUrl: coin.surfaceImages.reverse,
                engravers: [],
              },
        edge:
          coin.surfaceImages.edge === null
            ? null
            : {
                description: null,
                lettering: null,
                imageUrl: coin.surfaceImages.edge,
              },
      },
    })),
    nextCursor: response.nextCursor,
  }
}

const getCoinListData = createServerFn({ method: "GET" })
  .inputValidator(coinListInputSchema)
  .handler(async ({ data }) => getPublicCoinList(data))

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
    const [coinListData, filterOptions] = await Promise.all([
      getCoinListData({ data: deps }),
      getCoinFilterOptions(),
    ])

    return {
      ...coinListData,
      filterOptions,
    }
  },
  component: App,
})

function App() {
  const { coins, filterOptions, nextCursor } = Route.useLoaderData()
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
    <>
      <form
        action={updateCoinTitleSearch}
        className="mb-4 flex w-full max-w-xl gap-2"
      >
        <Input
          type="search"
          name="q"
          defaultValue={search.q ?? ""}
          placeholder="Search Coin Titles"
        />
        <Button type="submit">Search</Button>
      </form>
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

      {coins.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveCoinSearchFilters(search)} />
      ) : (
        <div className="grid h-full w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 [@media(min-width:1920px)]:[grid-template-columns:repeat(auto-fit,minmax(0,290px))]">
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
  )
}
