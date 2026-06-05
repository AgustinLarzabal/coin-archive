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

const getCoinListData = createServerFn({ method: "GET" })
  .inputValidator(coinListInputSchema)
  .handler(async ({ data }) => {
    const { getCatalogues, getCoins, getIssuers, getRulers } =
      await import("@workspace/db")

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
    <div>
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

      {/* Keep JSON */}

      <pre className="text-xs">{JSON.stringify(coins, null, 2)}</pre>
    </div>
  )
}
