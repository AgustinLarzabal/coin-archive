import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { FormEvent } from "react"
import type {
  CatalogueOption,
  CoinMeasurements,
  CompositionOption,
  CurrencyOption,
  DistributionOption,
  IssuerOption,
  MintOption,
  OrientationOption,
  RulerOption,
  ThemeOption,
} from "@workspace/db"
import {
  applyFaceValueRangeSearch,
  applyMeasurementRangeSearch,
  applyIssueYearRangeSearch,
  coinListInputSchema,
  coinSearchSchema,
  findSelectedCatalogueOption,
  findSelectedCompositionOption,
  findSelectedCurrencyOption,
  findSelectedDistributionOption,
  findSelectedMintOption,
  findSelectedOrientationOption,
  findSelectedThemeOption,
  formatMintNames,
  formatMeasurementLabel,
  formatIssueYearRangeLabel,
  getCatalogueOptionLabel,
  getCompositionOptionLabel,
  getCurrencyOptionLabel,
  getDistributionOptionLabel,
  getCoinListLoaderDeps,
  getMintOptionLabel,
  getRulerOptionLabel,
  isCodeOptionEqual,
  updateCoinSearchFilter,
} from "../lib/coin-search"
import type {
  CoinSearch,
  FaceValueFilterName,
  MeasurementFilterName,
  PositiveNumberFilterName,
  PositiveNumberFilterValue,
  TextCoinSearchFilterName,
} from "../lib/coin-search"
import { CoinListItem } from "../components/coin-list-item"
import { OrientationFilterCombobox } from "../components/orientation-filter-combobox"
import { ThemeFilterCombobox } from "../components/theme-filter-combobox"

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
type RangeInputField<Name extends string> = Readonly<{
  ariaLabel: string
  name: Name
  placeholder: string
}>

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
] as const satisfies ReadonlyArray<RangeInputField<MeasurementFilterName>>

const faceValueRangeInputFields = [
  {
    name: "minValue",
    ariaLabel: "Minimum face value in major units",
    placeholder: "Min face value",
  },
  {
    name: "maxValue",
    ariaLabel: "Maximum face value in major units",
    placeholder: "Max face value",
  },
] as const satisfies ReadonlyArray<RangeInputField<FaceValueFilterName>>

const coinMeasurementFields = [
  { key: "weight", label: "Weight", unit: "g" },
  { key: "diameter", label: "Diameter", unit: "mm" },
  { key: "thickness", label: "Thickness", unit: "mm" },
] as const satisfies ReadonlyArray<{
  key: keyof CoinMeasurements
  label: string
  unit: string
}>

function getRangeFromFormData<Name extends PositiveNumberFilterName>(
  formData: FormData,
  fields: ReadonlyArray<RangeInputField<Name>>
): Record<Name, PositiveNumberFilterValue> {
  return Object.fromEntries(
    fields.map(({ name }) => [name, formData.get(name)])
  ) as Record<Name, PositiveNumberFilterValue>
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
      getCurrencies,
      getDistributions,
      getIssuers,
      getMints,
      getOrientations,
      getRulers,
      getThemes,
    } = await import("@workspace/db")

    const [
      coins,
      catalogues,
      compositions,
      currencies,
      distributions,
      issuers,
      mints,
      orientations,
      rulers,
      themes,
    ] = await Promise.all([
      getCoins(data),
      getCatalogues(),
      getCompositions(),
      getCurrencies(),
      getDistributions(),
      getIssuers(),
      getMints(),
      getOrientations(),
      getRulers(),
      getThemes(),
    ])

    return {
      coins,
      catalogues,
      compositions,
      currencies,
      distributions,
      issuers,
      mints,
      orientations,
      rulers,
      themes,
    }
  })

export const Route = createFileRoute("/")({
  validateSearch: coinSearchSchema,
  loaderDeps: ({ search }) => getCoinListLoaderDeps(search),
  loader: ({ deps }) => getCoinListData({ data: deps }),
  component: App,
})

function App() {
  const {
    coins,
    catalogues,
    compositions,
    currencies,
    distributions,
    issuers,
    mints,
    orientations,
    rulers,
    themes,
  } = Route.useLoaderData()
  const {
    catalogue: selectedCatalogueCode,
    composition: selectedCompositionCode,
    currency: selectedCurrencyCode,
    distribution: selectedDistributionCode,
    fromYear: selectedFromYear,
    issuer: selectedIssuerCode,
    maxDiameter: selectedMaxDiameter,
    maxThickness: selectedMaxThickness,
    maxWeight: selectedMaxWeight,
    maxValue: selectedMaxValue,
    mint: selectedMintCode,
    orientation: selectedOrientationCode,
    minDiameter: selectedMinDiameter,
    minThickness: selectedMinThickness,
    minWeight: selectedMinWeight,
    minValue: selectedMinValue,
    referenceNumber: selectedReferenceNumber,
    ruler: selectedRulerCode,
    theme: selectedThemeCode,
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
  const selectedFaceValueRange = {
    minValue: selectedMinValue,
    maxValue: selectedMaxValue,
  } satisfies Record<FaceValueFilterName, number | undefined>

  const selectedCatalogue = findSelectedCatalogueOption(
    catalogues,
    selectedCatalogueCode
  )
  const selectedComposition = findSelectedCompositionOption(
    compositions,
    selectedCompositionCode
  )
  const selectedCurrency = findSelectedCurrencyOption(
    currencies,
    selectedCurrencyCode
  )
  const selectedDistribution = findSelectedDistributionOption(
    distributions,
    selectedDistributionCode
  )
  const selectedMint = findSelectedMintOption(mints, selectedMintCode)
  const selectedOrientation = findSelectedOrientationOption(
    orientations,
    selectedOrientationCode
  )
  const selectedTheme = findSelectedThemeOption(themes, selectedThemeCode)
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
  const selectComposition =
    createSelectHandler<CompositionOption>("composition")
  const selectCurrency = createSelectHandler<CurrencyOption>("currency")
  const selectDistribution =
    createSelectHandler<DistributionOption>("distribution")
  const selectMint = createSelectHandler<MintOption>("mint")
  const selectOrientation =
    createSelectHandler<OrientationOption>("orientation")
  const selectRuler = createSelectHandler<RulerOption>("ruler")
  const selectTheme = createSelectHandler<ThemeOption>("theme")

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

  function createPositiveNumberRangeSubmitHandler<
    Name extends PositiveNumberFilterName,
  >(
    fields: ReadonlyArray<RangeInputField<Name>>,
    applyRangeSearch: (
      currentSearch: CoinSearch,
      range: Record<Name, PositiveNumberFilterValue>
    ) => CoinSearch
  ) {
    return async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const formData = new FormData(event.currentTarget)

      await navigate({
        search: (currentSearch) =>
          applyRangeSearch(
            currentSearch,
            getRangeFromFormData(formData, fields)
          ),
      })
    }
  }

  const updateFaceValueRange = createPositiveNumberRangeSubmitHandler(
    faceValueRangeInputFields,
    applyFaceValueRangeSearch
  )
  const updateMeasurementRange = createPositiveNumberRangeSubmitHandler(
    measurementRangeInputFields,
    applyMeasurementRangeSearch
  )

  return (
    <div>
      <Combobox<IssuerOption>
        items={issuers}
        value={selectedIssuer}
        itemToStringLabel={(issuer) => issuer.name}
        isItemEqualToValue={isCodeOptionEqual}
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
        isItemEqualToValue={isCodeOptionEqual}
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
        isItemEqualToValue={isCodeOptionEqual}
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
        isItemEqualToValue={isCodeOptionEqual}
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

      <Combobox<CurrencyOption>
        items={currencies}
        value={selectedCurrency}
        itemToStringLabel={getCurrencyOptionLabel}
        isItemEqualToValue={isCodeOptionEqual}
        onValueChange={selectCurrency}
      >
        <ComboboxInput placeholder="Filter by currency" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No currencies found.</ComboboxEmpty>
          <ComboboxList>
            {(currency: CurrencyOption) => (
              <ComboboxItem key={currency.code} value={currency}>
                <span>{currency.name}</span>
                <span className="text-muted-foreground">{currency.code}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <Combobox<DistributionOption>
        items={distributions}
        value={selectedDistribution}
        itemToStringLabel={getDistributionOptionLabel}
        isItemEqualToValue={isCodeOptionEqual}
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

      <Combobox<MintOption>
        items={mints}
        value={selectedMint}
        itemToStringLabel={getMintOptionLabel}
        isItemEqualToValue={isCodeOptionEqual}
        onValueChange={selectMint}
      >
        <ComboboxInput placeholder="Filter by mint" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No mints found.</ComboboxEmpty>
          <ComboboxList>
            {(mint: MintOption) => (
              <ComboboxItem key={mint.code} value={mint}>
                <span>{mint.name}</span>
                <span className="text-muted-foreground">{mint.code}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <OrientationFilterCombobox
        onValueChange={selectOrientation}
        orientations={orientations}
        selectedOrientation={selectedOrientation}
      />

      <ThemeFilterCombobox
        onValueChange={selectTheme}
        selectedTheme={selectedTheme}
        themes={themes}
      />

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
        onSubmit={updateFaceValueRange}
      >
        {faceValueRangeInputFields.map(({ ariaLabel, name, placeholder }) => (
          <Input
            aria-label={ariaLabel}
            defaultValue={selectedFaceValueRange[name]?.toString() ?? ""}
            key={`${name}-${selectedFaceValueRange[name] ?? ""}`}
            name={name}
            placeholder={placeholder}
            step="0.000001"
            type="number"
          />
        ))}
        <button
          className="rounded border border-border px-3 py-2"
          type="submit"
        >
          Apply face value
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
          const mintNames = coin.mints.length > 0 ? formatMintNames(coin.mints) : null

          return (
            <CoinListItem
              coin={coin}
              issueYearRangeLabel={formatIssueYearRangeLabel(coin.issueYearRange)}
              key={coin.id}
              measurementSummary={measurementSummary}
              mintNames={mintNames}
            />
          )
        })}
      </ul>

      {/* Keep JSON - DO NOT REMOVE */}
      <pre className="text-xs">{JSON.stringify(coins, null, 2)}</pre>
    </div>
  )
}
