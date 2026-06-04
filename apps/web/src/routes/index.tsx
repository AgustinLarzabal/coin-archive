import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import type { CatalogueOption, IssuerOption, RulerOption } from "@workspace/db"
import {
  getCatalogueOptionLabel,
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

const optionalCatalogueCodeSchema = z.string().optional()
const optionalIssuerCodeSchema = z.string().optional()
const optionalReferenceNumberSchema = z.string().optional()
const optionalRulerCodeSchema = z.string().optional()
const coinSearchSchema = z.object({
  catalogue: optionalCatalogueCodeSchema,
  issuer: optionalIssuerCodeSchema,
  referenceNumber: optionalReferenceNumberSchema,
  ruler: optionalRulerCodeSchema,
})
const coinListInputSchema = z.object({
  catalogueCode: optionalCatalogueCodeSchema,
  issuerCode: optionalIssuerCodeSchema,
  referenceNumber: optionalReferenceNumberSchema,
  rulerCode: optionalRulerCodeSchema,
})

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
  loaderDeps: ({ search }) => ({
    catalogueCode: search.catalogue,
    issuerCode: search.issuer,
    referenceNumber: search.referenceNumber,
    rulerCode: search.ruler,
  }),
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

  const selectedCatalogue =
    catalogues.find(
      (catalogue) =>
        catalogue.code.toLowerCase() === selectedCatalogueCode?.toLowerCase()
    ) ?? null
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

  async function selectRuler(ruler: RulerOption | null) {
    await updateSearchFilter("ruler", ruler?.code)
  }

  return (
    <div>
      <div className="flex w-full max-w-4xl flex-col gap-4 md:flex-row">
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
          onChange={async (event) => {
            await updateSearchFilter("referenceNumber", event.target.value)
          }}
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
      <pre className="text-xs">{JSON.stringify(coins, null, 2)}</pre>
    </div>
  )
}
