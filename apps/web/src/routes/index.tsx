import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { FormEvent } from "react"
import type {
  CatalogueOption,
  CoinMeasurements,
  CompositionOption,
  DistributionOption,
  IssuerOption,
  RulerOption,
} from "@workspace/db"
import {
  applyMeasurementRangeSearch,
  applyIssueYearRangeSearch,
  coinListInputSchema,
  coinSearchSchema,
  findSelectedCatalogueOption,
  findSelectedCompositionOption,
  findSelectedDistributionOption,
  formatMeasurementLabel,
  formatIssueYearRangeLabel,
  getCatalogueOptionLabel,
  getCompositionOptionLabel,
  getDistributionOptionLabel,
  getCoinListLoaderDeps,
  getRulerOptionLabel,
  updateCoinSearchFilter,
} from "../lib/coin-search"
import type {
  MeasurementFilterName,
  MeasurementFilterValue,
  TextCoinSearchFilterName,
} from "../lib/coin-search"

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

const measurementRangeInputFields = [
  {
    name: "minWeight",
    ariaLabel: "Minimum weight in grams",
    placeholder: "Min weight (g)",
  },
  {
    name: "maxWeight",
    ariaLabel: "Maximum weight in grams",
    placeholder: "Max weight (g)",
  },
  {
    name: "minDiameter",
    ariaLabel: "Minimum diameter in millimeters",
    placeholder: "Min diameter (mm)",
  },
  {
    name: "maxDiameter",
    ariaLabel: "Maximum diameter in millimeters",
    placeholder: "Max diameter (mm)",
  },
  {
    name: "minThickness",
    ariaLabel: "Minimum thickness in millimeters",
    placeholder: "Min thickness (mm)",
  },
  {
    name: "maxThickness",
    ariaLabel: "Maximum thickness in millimeters",
    placeholder: "Max thickness (mm)",
  },
] as const satisfies ReadonlyArray<{
  ariaLabel: string
  name: MeasurementFilterName
  placeholder: string
}>

const coinMeasurementFields = [
  { key: "weight", label: "Weight", unit: "g" },
  { key: "diameter", label: "Diameter", unit: "mm" },
  { key: "thickness", label: "Thickness", unit: "mm" },
] as const satisfies ReadonlyArray<{
  key: keyof CoinMeasurements
  label: string
  unit: string
}>

function getMeasurementRangeFromFormData(
  formData: FormData
): Record<MeasurementFilterName, MeasurementFilterValue> {
  return Object.fromEntries(
    measurementRangeInputFields.map(({ name }) => [name, formData.get(name)])
  ) as Record<MeasurementFilterName, MeasurementFilterValue>
}

function formatCoinMeasurements(measurements: CoinMeasurements) {
  const labels = coinMeasurementFields
    .map(({ key, label, unit }) =>
      formatMeasurementLabel(label, measurements[key], unit)
    )
    .filter((measurementLabel): measurementLabel is string => {
      return measurementLabel !== null
    })

  if (labels.length === 0) {
    return null
  }

  return labels.join(" · ")
}

const getCoinListData = createServerFn({ method: "GET" })
  .inputValidator(coinListInputSchema)
  .handler(async ({ data }) => {
    const {
      getCatalogues,
      getCoins,
      getCompositions,
      getDistributions,
      getIssuers,
      getRulers,
    } = await import("@workspace/db")

    const [coins, catalogues, compositions, distributions, issuers, rulers] =
      await Promise.all([
        getCoins({
          catalogueCode: data.catalogueCode,
          compositionCode: data.compositionCode,
          distributionCode: data.distributionCode,
          fromYear: data.fromYear,
          issuerCode: data.issuerCode,
          maxDiameter: data.maxDiameter,
          maxThickness: data.maxThickness,
          maxWeight: data.maxWeight,
          minDiameter: data.minDiameter,
          minThickness: data.minThickness,
          minWeight: data.minWeight,
          referenceNumber: data.referenceNumber,
          rulerCode: data.rulerCode,
          toYear: data.toYear,
        }),
        getCatalogues(),
        getCompositions(),
        getDistributions(),
        getIssuers(),
        getRulers(),
      ])

    return { coins, catalogues, compositions, distributions, issuers, rulers }
  })

export const Route = createFileRoute("/")({
  validateSearch: coinSearchSchema,
  loaderDeps: ({ search }) => getCoinListLoaderDeps(search),
  loader: ({ deps }) => getCoinListData({ data: deps }),
  component: App,
})

function App() {
  const { coins, catalogues, compositions, distributions, issuers, rulers } =
    Route.useLoaderData()
  const {
    catalogue: selectedCatalogueCode,
    composition: selectedCompositionCode,
    distribution: selectedDistributionCode,
    fromYear: selectedFromYear,
    issuer: selectedIssuerCode,
    maxDiameter: selectedMaxDiameter,
    maxThickness: selectedMaxThickness,
    maxWeight: selectedMaxWeight,
    minDiameter: selectedMinDiameter,
    minThickness: selectedMinThickness,
    minWeight: selectedMinWeight,
    referenceNumber: selectedReferenceNumber,
    ruler: selectedRulerCode,
    toYear: selectedToYear,
  } = Route.useSearch()
  const navigate = Route.useNavigate()
  const selectedMeasurementRange = {
    minWeight: selectedMinWeight,
    maxWeight: selectedMaxWeight,
    minDiameter: selectedMinDiameter,
    maxDiameter: selectedMaxDiameter,
    minThickness: selectedMinThickness,
    maxThickness: selectedMaxThickness,
  } satisfies Record<MeasurementFilterName, number | undefined>

  const selectedCatalogue = findSelectedCatalogueOption(
    catalogues,
    selectedCatalogueCode
  )
  const selectedComposition = findSelectedCompositionOption(
    compositions,
    selectedCompositionCode
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
  const selectComposition = createSelectHandler<CompositionOption>("composition")
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

  async function updateMeasurementRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    await navigate({
      search: (currentSearch) =>
        applyMeasurementRangeSearch(
          currentSearch,
          getMeasurementRangeFromFormData(formData)
        ),
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

      <Combobox<CompositionOption>
        items={compositions}
        value={selectedComposition}
        itemToStringLabel={getCompositionOptionLabel}
        isItemEqualToValue={(composition, value) =>
          composition.code === value.code
        }
        onValueChange={selectComposition}
      >
        <ComboboxInput placeholder="Filter by composition" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No compositions found.</ComboboxEmpty>
          <ComboboxList>
            {(composition: CompositionOption) => (
              <ComboboxItem key={composition.code} value={composition}>
                <span>{composition.name}</span>
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

      <form
        className="flex flex-wrap items-end gap-2 py-2"
        onSubmit={updateMeasurementRange}
      >
        {measurementRangeInputFields.map(({ ariaLabel, name, placeholder }) => (
          <Input
            aria-label={ariaLabel}
            defaultValue={selectedMeasurementRange[name]?.toString() ?? ""}
            key={`${name}-${selectedMeasurementRange[name] ?? ""}`}
            name={name}
            placeholder={placeholder}
            step="0.01"
            type="number"
          />
        ))}
        <button
          className="rounded border border-border px-3 py-2"
          type="submit"
        >
          Apply measurements
        </button>
      </form>

      <ul className="space-y-4 py-4">
        {coins.map((coin) => {
          const measurementSummary = formatCoinMeasurements(coin.measurements)

          return (
            <li className="border-b border-border pb-4" key={coin.id}>
              <p className="font-medium">{coin.title}</p>
              <p className="text-sm text-muted-foreground">
                {coin.issuer.name} · {coin.distribution.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Composition: {coin.composition.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatIssueYearRangeLabel(coin.issueYearRange)}
              </p>
              {measurementSummary ? (
                <p className="text-sm text-muted-foreground">
                  {measurementSummary}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>

      {/* Keep JSON - DO NOT REMOVE */}
      <pre className="text-xs">{JSON.stringify(coins, null, 2)}</pre>
    </div>
  )
}
