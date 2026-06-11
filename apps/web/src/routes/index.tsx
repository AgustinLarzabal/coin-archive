import { createFileRoute, getRouteApi } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { FormEvent } from "react"
import type {
  CatalogueOption,
  CoinMeasurements,
  CompositionOption,
  CurrencyOption,
  DistributionOption,
  EdgeOption,
  EngraverOption,
  IssuerOption,
  MintOption,
  OrientationOption,
  RimOption,
  RulerOption,
  ShapeOption,
  TechniqueOption,
  ThemeOption,
} from "@workspace/db"
import {
  applyFaceValueRangeSearch,
  applyMeasurementRangeSearch,
  applyIssueYearRangeSearch,
  coinListInputSchema,
  coinSearchSchema,
  findSelectedDemonetizationFilterOption,
  findSelectedCatalogueOption,
  findSelectedCompositionOption,
  findSelectedCurrencyOption,
  findSelectedDistributionOption,
  findSelectedEdgeOption,
  findSelectedEngraverOption,
  findSelectedIssuerOption,
  findSelectedMintOption,
  findSelectedOrientationOption,
  findSelectedRimOption,
  findSelectedRulerOption,
  findSelectedShapeOption,
  findSelectedTechniqueOption,
  findSelectedThemeOption,
  formatMintNames,
  formatMeasurementLabel,
  formatIssueYearRangeLabel,
  getCoinListLoaderDeps,
  updateCoinSearchFilter,
} from "../lib/coin-search"
import type {
  CoinSearch,
  DemonetizationFilterOption,
  FaceValueFilterName,
  MeasurementFilterName,
  PositiveNumberFilterName,
  PositiveNumberFilterValue,
  TextCoinSearchFilterName,
} from "../lib/coin-search"
import { CoinListItem } from "../components/coin-list-item"
import { CatalogueFilterCombobox } from "../components/catalogue-filter-combobox"
import { CompositionFilterCombobox } from "../components/composition-filter-combobox"
import { CurrencyFilterCombobox } from "../components/currency-filter-combobox"
import { DemonetizationFilterCombobox } from "../components/demonetization-filter-combobox"
import { DistributionFilterCombobox } from "../components/distribution-filter-combobox"
import { EdgeFilterCombobox } from "../components/edge-filter-combobox"
import { EngraverFilterCombobox } from "../components/engraver-filter-combobox"
import { IssuerFilterCombobox } from "../components/issuer-filter-combobox"
import { MintFilterCombobox } from "../components/mint-filter-combobox"
import { OrientationFilterCombobox } from "../components/orientation-filter-combobox"
import { RimFilterCombobox } from "../components/rim-filter-combobox"
import { RulerFilterCombobox } from "../components/ruler-filter-combobox"
import { ShapeFilterCombobox } from "../components/shape-filter-combobox"
import { TechniqueFilterCombobox } from "../components/technique-filter-combobox"
import { ThemeFilterCombobox } from "../components/theme-filter-combobox"

import { Input } from "@workspace/ui/components/input"

type OptionWithCode = { code: string }
type RangeInputField<TName extends string> = Readonly<{
  ariaLabel: string
  name: TName
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

function getRangeFromFormData<TName extends PositiveNumberFilterName>(
  formData: FormData,
  fields: ReadonlyArray<RangeInputField<TName>>
): Record<TName, PositiveNumberFilterValue> {
  return Object.fromEntries(
    fields.map(({ name }) => [name, formData.get(name)])
  ) as Record<TName, PositiveNumberFilterValue>
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
    const { getCoins } = await import("@workspace/db")

    return { coins: await getCoins(data) }
  })

const rootRouteApi = getRouteApi("__root__")

export const Route = createFileRoute("/")({
  validateSearch: coinSearchSchema,
  loaderDeps: ({ search }) => getCoinListLoaderDeps(search),
  loader: ({ deps }) => getCoinListData({ data: deps }),
  component: App,
})

function App() {
  const { coins } = Route.useLoaderData()
  const {
    catalogues,
    compositions,
    currencies,
    distributions,
    edges,
    engravers,
    issuers,
    mints,
    orientations,
    rims,
    rulers,
    shapes,
    techniques,
    themes,
  } = rootRouteApi.useLoaderData()
  const {
    catalogue: selectedCatalogueCode,
    composition: selectedCompositionCode,
    currency: selectedCurrencyCode,
    demonetization: selectedDemonetization,
    distribution: selectedDistributionCode,
    edge: selectedEdgeCode,
    engraver: selectedEngraverCode,
    fromYear: selectedFromYear,
    issuer: selectedIssuerCode,
    maxDiameter: selectedMaxDiameter,
    maxThickness: selectedMaxThickness,
    maxWeight: selectedMaxWeight,
    maxValue: selectedMaxValue,
    mint: selectedMintCode,
    orientation: selectedOrientationCode,
    rim: selectedRimCode,
    minDiameter: selectedMinDiameter,
    minThickness: selectedMinThickness,
    minWeight: selectedMinWeight,
    minValue: selectedMinValue,
    referenceNumber: selectedReferenceNumber,
    ruler: selectedRulerCode,
    shape: selectedShapeCode,
    technique: selectedTechniqueCode,
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
  const selectedDemonetizationOption = findSelectedDemonetizationFilterOption(
    selectedDemonetization
  )
  const selectedEdge = findSelectedEdgeOption(edges, selectedEdgeCode)
  const selectedEngraver = findSelectedEngraverOption(
    engravers,
    selectedEngraverCode
  )
  const selectedMint = findSelectedMintOption(mints, selectedMintCode)
  const selectedOrientation = findSelectedOrientationOption(
    orientations,
    selectedOrientationCode
  )
  const selectedRim = findSelectedRimOption(rims, selectedRimCode)
  const selectedShape = findSelectedShapeOption(shapes, selectedShapeCode)
  const selectedTechnique = findSelectedTechniqueOption(
    techniques,
    selectedTechniqueCode
  )
  const selectedTheme = findSelectedThemeOption(themes, selectedThemeCode)
  const selectedIssuer = findSelectedIssuerOption(issuers, selectedIssuerCode)
  const selectedRuler = findSelectedRulerOption(rulers, selectedRulerCode)

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
  const selectDemonetization =
    createSelectHandler<DemonetizationFilterOption>("demonetization")
  const selectEdge = createSelectHandler<EdgeOption>("edge")
  const selectEngraver = createSelectHandler<EngraverOption>("engraver")
  const selectMint = createSelectHandler<MintOption>("mint")
  const selectOrientation =
    createSelectHandler<OrientationOption>("orientation")
  const selectRim = createSelectHandler<RimOption>("rim")
  const selectRuler = createSelectHandler<RulerOption>("ruler")
  const selectShape = createSelectHandler<ShapeOption>("shape")
  const selectTechnique = createSelectHandler<TechniqueOption>("technique")
  const selectTheme = createSelectHandler<ThemeOption>("theme")

  async function updateReferenceNumberFromForm(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const referenceNumber = new FormData(event.currentTarget).get(
      "referenceNumber"
    )

    await updateSearchFilter(
      "referenceNumber",
      typeof referenceNumber === "string" ? referenceNumber.trim() : undefined
    )
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
    TName extends PositiveNumberFilterName,
  >(
    fields: ReadonlyArray<RangeInputField<TName>>,
    applyRangeSearch: (
      currentSearch: CoinSearch,
      range: Record<TName, PositiveNumberFilterValue>
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
      <IssuerFilterCombobox
        issuers={issuers}
        onValueChange={selectIssuer}
        selectedIssuer={selectedIssuer}
      />

      <RulerFilterCombobox
        onValueChange={selectRuler}
        rulers={rulers}
        selectedRuler={selectedRuler}
      />

      <CatalogueFilterCombobox
        catalogues={catalogues}
        onValueChange={selectCatalogue}
        selectedCatalogue={selectedCatalogue}
      />

      <CompositionFilterCombobox
        compositions={compositions}
        onValueChange={selectComposition}
        selectedComposition={selectedComposition}
      />

      <CurrencyFilterCombobox
        currencies={currencies}
        onValueChange={selectCurrency}
        selectedCurrency={selectedCurrency}
      />

      <DistributionFilterCombobox
        distributions={distributions}
        onValueChange={selectDistribution}
        selectedDistribution={selectedDistribution}
      />

      <DemonetizationFilterCombobox
        onValueChange={selectDemonetization}
        selectedDemonetization={selectedDemonetizationOption}
      />

      <EdgeFilterCombobox
        edges={edges}
        onValueChange={selectEdge}
        selectedEdge={selectedEdge}
      />

      <EngraverFilterCombobox
        engravers={engravers}
        onValueChange={selectEngraver}
        selectedEngraver={selectedEngraver}
      />

      <MintFilterCombobox
        mints={mints}
        onValueChange={selectMint}
        selectedMint={selectedMint}
      />

      <OrientationFilterCombobox
        onValueChange={selectOrientation}
        orientations={orientations}
        selectedOrientation={selectedOrientation}
      />

      <ShapeFilterCombobox
        onValueChange={selectShape}
        selectedShape={selectedShape}
        shapes={shapes}
      />

      <RimFilterCombobox
        onValueChange={selectRim}
        rims={rims}
        selectedRim={selectedRim}
      />

      <TechniqueFilterCombobox
        onValueChange={selectTechnique}
        selectedTechnique={selectedTechnique}
        techniques={techniques}
      />

      <ThemeFilterCombobox
        onValueChange={selectTheme}
        selectedTheme={selectedTheme}
        themes={themes}
      />

      <form
        className="flex items-end gap-2 py-2"
        onSubmit={updateReferenceNumberFromForm}
      >
        <Input
          aria-label="Filter by reference number"
          className="md:max-w-40"
          defaultValue={selectedReferenceNumber ?? ""}
          key={`reference-number-${selectedReferenceNumber ?? ""}`}
          name="referenceNumber"
          placeholder="Reference number"
        />
        <button
          className="rounded border border-border px-3 py-2"
          type="submit"
        >
          Apply reference
        </button>
      </form>

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
    </div>
  )
}
