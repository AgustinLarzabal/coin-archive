import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import type { IssuerOption, RulerOption } from "@workspace/db"
import { getRulerOptionLabel, updateCoinSearchFilter } from "../lib/coin-search"
import type { CoinSearchFilterName } from "../lib/coin-search"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

const optionalIssuerCodeSchema = z.string().optional()
const optionalRulerCodeSchema = z.string().optional()
const coinSearchSchema = z.object({
  issuer: optionalIssuerCodeSchema,
  ruler: optionalRulerCodeSchema,
})
const coinListInputSchema = z.object({
  issuerCode: optionalIssuerCodeSchema,
  rulerCode: optionalRulerCodeSchema,
})

const getCoinListData = createServerFn({ method: "GET" })
  .inputValidator(coinListInputSchema)
  .handler(async ({ data }) => {
    const { getCoins, getIssuers, getRulers } = await import("@workspace/db")

    const [coins, issuers, rulers] = await Promise.all([
      getCoins({ issuerCode: data.issuerCode, rulerCode: data.rulerCode }),
      getIssuers(),
      getRulers(),
    ])

    return { coins, issuers, rulers }
  })

export const Route = createFileRoute("/")({
  validateSearch: coinSearchSchema,
  loaderDeps: ({ search }) => ({
    issuerCode: search.issuer,
    rulerCode: search.ruler,
  }),
  loader: ({ deps }) => getCoinListData({ data: deps }),
  component: App,
})

function App() {
  const { coins, issuers, rulers } = Route.useLoaderData()
  const { issuer: selectedIssuerCode, ruler: selectedRulerCode } =
    Route.useSearch()
  const navigate = Route.useNavigate()

  const selectedIssuer =
    issuers.find((issuer) => issuer.code === selectedIssuerCode) ?? null
  const selectedRuler =
    rulers.find((ruler) => ruler.code === selectedRulerCode) ?? null

  async function updateSearchFilter(
    filterName: CoinSearchFilterName,
    filterValue: string | undefined
  ) {
    await navigate({
      search: (currentSearch) =>
        updateCoinSearchFilter(currentSearch, filterName, filterValue),
    })
  }

  async function selectIssuer(issuer: IssuerOption | null) {
    await updateSearchFilter("issuer", issuer?.code)
  }

  async function selectRuler(ruler: RulerOption | null) {
    await updateSearchFilter("ruler", ruler?.code)
  }

  return (
    <div>
      <div className="flex w-full max-w-4xl flex-col gap-4 md:flex-row">
        <Combobox<IssuerOption>
          items={issuers}
          value={selectedIssuer}
          itemToStringLabel={(issuer) => issuer.name}
          isItemEqualToValue={(issuer, value) => issuer.code === value.code}
          onValueChange={selectIssuer}
        >
          <ComboboxInput placeholder="Filter by issuer" showClear />
          <ComboboxContent>
            <ComboboxEmpty>No issuers found.</ComboboxEmpty>
            <ComboboxList>
              {(issuer: IssuerOption) => (
                <ComboboxItem key={issuer.code} value={issuer}>
                  <span>{issuer.name}</span>
                  <span className="text-muted-foreground">{issuer.code}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Combobox<RulerOption>
          items={rulers}
          value={selectedRuler}
          itemToStringLabel={getRulerOptionLabel}
          isItemEqualToValue={(ruler, value) => ruler.code === value.code}
          onValueChange={selectRuler}
        >
          <ComboboxInput placeholder="Filter by ruler" showClear />
          <ComboboxContent>
            <ComboboxEmpty>No rulers found.</ComboboxEmpty>
            <ComboboxList>
              {(ruler: RulerOption) => (
                <ComboboxItem key={ruler.code} value={ruler}>
                  <span>{getRulerOptionLabel(ruler)}</span>
                  <span className="text-muted-foreground">{ruler.code}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <pre className="text-xs">{JSON.stringify(coins, null, 2)}</pre>
    </div>
  )
}
