import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { CatalogueOption, IssuerOption, RulerOption } from "@workspace/db"
import {
  coinListInputSchema,
  coinSearchSchema,
  findSelectedCatalogueOption,
  getCatalogueOptionLabel,
  getCoinListLoaderDeps,
  getRulerOptionLabel,
  updateCoinSearchFilter,
} from "../lib/coin-search"
import type { CoinSearchFilterName } from "../lib/coin-search"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { Input } from "@workspace/ui/components/input"
import { CoinList } from "../components/coin-list"

const getCoinListData = createServerFn({ method: "GET" })
  .inputValidator(coinListInputSchema)
  .handler(async ({ data }) => {
    const { getCatalogues, getCoins, getIssuers, getRulers } = await import(
      "@workspace/db"
    )

    const [coins, catalogues, issuers, rulers] = await Promise.all([
      getCoins({
        catalogueCode: data.catalogueCode,
        issuerCode: data.issuerCode,
        referenceNumber: data.referenceNumber,
        rulerCode: data.rulerCode,
      }),
      getCatalogues(),
      getIssuers(),
      getRulers(),
    ])

    return { coins, catalogues, issuers, rulers }
  })

export const Route = createFileRoute("/")({
  validateSearch: coinSearchSchema,
  loaderDeps: ({ search }) => getCoinListLoaderDeps(search),
  loader: ({ deps }) => getCoinListData({ data: deps }),
  component: App,
})

function App() {
  const { coins, catalogues, issuers, rulers } = Route.useLoaderData()
  const {
    catalogue: selectedCatalogueCode,
    issuer: selectedIssuerCode,
    referenceNumber: selectedReferenceNumber,
    ruler: selectedRulerCode,
  } = Route.useSearch()
  const navigate = Route.useNavigate()

  const selectedCatalogue = findSelectedCatalogueOption(
    catalogues,
    selectedCatalogueCode
  )
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

  async function selectCatalogue(catalogue: CatalogueOption | null) {
    await updateSearchFilter("catalogue", catalogue?.code)
  }

  async function updateReferenceNumber(referenceNumber: string) {
    await updateSearchFilter("referenceNumber", referenceNumber)
  }

  async function selectRuler(ruler: RulerOption | null) {
    await updateSearchFilter("ruler", ruler?.code)
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Coin Archive
        </p>
        <h1 className="max-w-3xl text-3xl font-medium tracking-tight">
          Browse coins by catalogue reference, issuer, and ruler.
        </h1>
      </header>

      <div className="grid gap-4 rounded-[2rem] border border-border/70 bg-card/70 p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Combobox<CatalogueOption>
          items={catalogues}
          value={selectedCatalogue}
          itemToStringLabel={getCatalogueOptionLabel}
          isItemEqualToValue={(catalogue, value) => catalogue.code === value.code}
          onValueChange={selectCatalogue}
        >
          <ComboboxInput placeholder="Filter by catalogue" showClear />
          <ComboboxContent>
            <ComboboxEmpty>No catalogues found.</ComboboxEmpty>
            <ComboboxList>
              {(catalogue: CatalogueOption) => (
                <ComboboxItem key={catalogue.code} value={catalogue}>
                  <span>{catalogue.title}</span>
                  <span className="text-muted-foreground">{catalogue.code}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Input
          aria-label="Filter by reference number"
          className="md:max-w-40"
          onChange={(event) => updateReferenceNumber(event.target.value)}
          placeholder="Reference number"
          value={selectedReferenceNumber ?? ""}
        />

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

      <CoinList coins={coins} />
    </div>
  )
}
