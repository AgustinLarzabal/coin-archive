import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { FormEvent } from "react"
import type {
  CatalogueOption,
  DistributionOption,
  IssuerOption,
  RulerOption,
} from "@workspace/db"
import {
  applyIssueYearRangeSearch,
  coinListInputSchema,
  coinSearchSchema,
  findSelectedCatalogueOption,
  findSelectedDistributionOption,
  formatCoinMeasurementsLabel,
  formatIssueYearRangeLabel,
  getCatalogueOptionLabel,
  getDistributionOptionLabel,
  getCoinListLoaderDeps,
  getRulerOptionLabel,
  updateCoinSearchFilter,
} from "../lib/coin-search"
import type { TextCoinSearchFilterName } from "../lib/coin-search"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { Input } from "@workspace/ui/components/input"

type OptionWithCode = { code: string }

const getCoinListData = createServerFn({ method: "GET" })
  .inputValidator(coinListInputSchema)
  .handler(async ({ data }) => {
    const { getCatalogues, getCoins, getDistributions, getIssuers, getRulers } =
      await import("@workspace/db")

    const [coins, catalogues, distributions, issuers, rulers] =
      await Promise.all([
        getCoins({
          catalogueCode: data.catalogueCode,
          distributionCode: data.distributionCode,
          fromYear: data.fromYear,
          issuerCode: data.issuerCode,
          referenceNumber: data.referenceNumber,
          rulerCode: data.rulerCode,
          toYear: data.toYear,
        }),
        getCatalogues(),
        getDistributions(),
        getIssuers(),
        getRulers(),
      ])

    return { coins, catalogues, distributions, issuers, rulers }
  })

export const Route = createFileRoute("/")({
  validateSearch: coinSearchSchema,
  loaderDeps: ({ search }) => getCoinListLoaderDeps(search),
  loader: ({ deps }) => getCoinListData({ data: deps }),
  component: App,
})

function App() {
  const { coins, catalogues, distributions, issuers, rulers } =
    Route.useLoaderData()
  const {
    catalogue: selectedCatalogueCode,
    distribution: selectedDistributionCode,
    fromYear: selectedFromYear,
    issuer: selectedIssuerCode,
    referenceNumber: selectedReferenceNumber,
    ruler: selectedRulerCode,
    toYear: selectedToYear,
  } = Route.useSearch()
  const navigate = Route.useNavigate()

  const selectedCatalogue = findSelectedCatalogueOption(
    catalogues,
    selectedCatalogueCode
  )
  const selectedDistribution = findSelectedDistributionOption(
    distributions,
    selectedDistributionCode
  )
  const selectedIssuer =
    issuers.find((issuer) => issuer.code === selectedIssuerCode) ?? null
  const selectedRuler =
    rulers.find((ruler) => ruler.code === selectedRulerCode) ?? null

  async function updateSearchFilter(
    filterName: TextCoinSearchFilterName,
    filterValue: string | undefined
  ) {
    await navigate({
      search: (currentSearch) =>
        updateCoinSearchFilter(currentSearch, filterName, filterValue),
    })
  }

  function createSelectHandler<T extends OptionWithCode>(
    filterName: TextCoinSearchFilterName
  ) {
    return async (option: T | null) =>
      updateSearchFilter(filterName, option?.code)
  }

  const selectIssuer = createSelectHandler<IssuerOption>("issuer")
  const selectCatalogue = createSelectHandler<CatalogueOption>("catalogue")
  const selectDistribution =
    createSelectHandler<DistributionOption>("distribution")
  const selectRuler = createSelectHandler<RulerOption>("ruler")

  async function updateReferenceNumber(referenceNumber: string) {
    await updateSearchFilter("referenceNumber", referenceNumber)
  }

  async function updateIssueYearRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    await navigate({
      search: (currentSearch) =>
        applyIssueYearRangeSearch(currentSearch, {
          fromYear: formData.get("fromYear"),
          toYear: formData.get("toYear"),
        }),
    })
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

      <Combobox<DistributionOption>
        items={distributions}
        value={selectedDistribution}
        itemToStringLabel={getDistributionOptionLabel}
        isItemEqualToValue={(distribution, value) =>
          distribution.code === value.code
        }
        onValueChange={selectDistribution}
      >
        <ComboboxInput placeholder="Filter by distribution" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No distributions found.</ComboboxEmpty>
          <ComboboxList>
            {(distribution: DistributionOption) => (
              <ComboboxItem key={distribution.code} value={distribution}>
                <span>{distribution.name}</span>
                <span className="text-muted-foreground">
                  {distribution.code}
                </span>
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

      <form
        className="flex items-end gap-2 py-2"
        onSubmit={updateIssueYearRange}
      >
        <Input
          aria-label="Filter from issue year"
          defaultValue={selectedFromYear?.toString() ?? ""}
          key={`from-year-${selectedFromYear ?? ""}`}
          name="fromYear"
          placeholder="From year"
          type="number"
        />
        <Input
          aria-label="Filter to issue year"
          defaultValue={selectedToYear?.toString() ?? ""}
          key={`to-year-${selectedToYear ?? ""}`}
          name="toYear"
          placeholder="To year"
          type="number"
        />
        <button
          className="rounded border border-border px-3 py-2"
          type="submit"
        >
          Apply years
        </button>
      </form>

      <ul className="space-y-4 py-4">
        {coins.map((coin) => (
          <CoinListItem coin={coin} key={coin.id} />
        ))}
      </ul>
    </div>
  )
}

type CoinListItemCoin = Awaited<ReturnType<typeof getCoinListData>>["coins"][number]

type CoinListItemProps = {
  coin: CoinListItemCoin
}

function CoinListItem({ coin }: CoinListItemProps) {
  const measurementsLabel = formatCoinMeasurementsLabel(coin.measurements)

  return (
    <li className="border-b border-border pb-4">
      <p className="font-medium">{coin.title}</p>
      <p className="text-sm text-muted-foreground">
        {coin.issuer.name} · {coin.distribution.name}
      </p>
      <p className="text-sm text-muted-foreground">
        {formatIssueYearRangeLabel(coin.issueYearRange)}
      </p>
      {measurementsLabel ? (
        <p className="text-sm text-muted-foreground">{measurementsLabel}</p>
      ) : null}
    </li>
  )
}
