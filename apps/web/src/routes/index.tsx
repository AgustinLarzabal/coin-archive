import { createFileRoute, getRouteApi } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { CoinMeasurements } from "@workspace/db"
import {
  applyMeasurementRangeSearch,
  applyIssueYearRangeSearch,
  applyFaceValueRangeSearch,
  coinListInputSchema,
  coinSearchSchema,
  findSelectedCodeOption,
  formatMintNames,
  formatMeasurementLabel,
  formatIssueYearRangeLabel,
  getCoinListLoaderDeps,
  updateCoinSearchFilter,
} from "../lib/coin-search"
import type {
  PositiveNumberFilterValue,
  TextCoinSearchFilterName,
} from "../lib/coin-search"
import { coinCodeFilterConfigs } from "../lib/coin-filter-configs"
import { CoinListItem } from "../components/coin-list-item"
import { NamedCodeFilterCombobox } from "../components/named-code-filter-combobox"

import { HomeFilters } from "@/components/home-filters"

const coinMeasurementFields = [
  { key: "weight", label: "Weight", unit: "g" },
  { key: "diameter", label: "Diameter", unit: "mm" },
  { key: "thickness", label: "Thickness", unit: "mm" },
] as const satisfies ReadonlyArray<{
  key: keyof CoinMeasurements
  label: string
  unit: string
}>

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
  const filterOptions = rootRouteApi.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  async function updateSearchFilter(
    filterName: TextCoinSearchFilterName,
    filterValue: string | undefined
  ) {
    await navigate({
      resetScroll: false,
      search: (currentSearch) =>
        updateCoinSearchFilter(currentSearch, filterName, filterValue),
    })
  }

  async function updateHomeFilters({
    catalogueCode,
    compositionCode,
    currencyCode,
    distributionCode,
    demonetization,
    edgeCode,
    engraverCode,
    fromYear,
    issuerCode,
    maxDiameter,
    maxThickness,
    maxValue,
    maxWeight,
    minDiameter,
    minThickness,
    minValue,
    minWeight,
    mintCode,
    orientationCode,
    referenceNumber,
    rimCode,
    rulerCode,
    shapeCode,
    techniqueCode,
    themeCode,
    toYear,
  }: {
    catalogueCode: string | undefined
    compositionCode: string | undefined
    currencyCode: string | undefined
    distributionCode: string | undefined
    demonetization: "demonetized" | "not-demonetized" | "unknown" | undefined
    edgeCode: string | undefined
    engraverCode: string | undefined
    fromYear: number | undefined
    issuerCode: string | undefined
    maxDiameter: PositiveNumberFilterValue
    maxThickness: PositiveNumberFilterValue
    maxValue: PositiveNumberFilterValue
    maxWeight: PositiveNumberFilterValue
    minDiameter: PositiveNumberFilterValue
    minThickness: PositiveNumberFilterValue
    minValue: PositiveNumberFilterValue
    minWeight: PositiveNumberFilterValue
    mintCode: string | undefined
    orientationCode: string | undefined
    referenceNumber: string | undefined
    rimCode: string | undefined
    rulerCode: string | undefined
    shapeCode: string | undefined
    techniqueCode: string | undefined
    themeCode: string | undefined
    toYear: number | undefined
  }) {
    await navigate({
      resetScroll: false,
      search: (currentSearch) => {
        const searchWithCatalogue = updateCoinSearchFilter(
          currentSearch,
          "catalogue",
          catalogueCode
        )
        const searchWithComposition = updateCoinSearchFilter(
          searchWithCatalogue,
          "composition",
          compositionCode
        )
        const searchWithCurrency = updateCoinSearchFilter(
          searchWithComposition,
          "currency",
          currencyCode
        )
        const searchWithDistribution = updateCoinSearchFilter(
          searchWithCurrency,
          "distribution",
          distributionCode
        )
        const searchWithDemonetization = updateCoinSearchFilter(
          searchWithDistribution,
          "demonetization",
          demonetization
        )
        const searchWithEdge = updateCoinSearchFilter(
          searchWithDemonetization,
          "edge",
          edgeCode
        )
        const searchWithEngraver = updateCoinSearchFilter(
          searchWithEdge,
          "engraver",
          engraverCode
        )
        const searchWithIssuer = updateCoinSearchFilter(
          searchWithEngraver,
          "issuer",
          issuerCode
        )
        const searchWithMint = updateCoinSearchFilter(
          searchWithIssuer,
          "mint",
          mintCode
        )
        const searchWithOrientation = updateCoinSearchFilter(
          searchWithMint,
          "orientation",
          orientationCode
        )
        const searchWithReferenceNumber = updateCoinSearchFilter(
          searchWithOrientation,
          "referenceNumber",
          catalogueCode ? referenceNumber : undefined
        )
        const searchWithRim = updateCoinSearchFilter(
          searchWithReferenceNumber,
          "rim",
          rimCode
        )
        const searchWithShape = updateCoinSearchFilter(
          searchWithRim,
          "shape",
          shapeCode
        )
        const searchWithTechnique = updateCoinSearchFilter(
          searchWithShape,
          "technique",
          techniqueCode
        )
        const searchWithTheme = updateCoinSearchFilter(
          searchWithTechnique,
          "theme",
          themeCode
        )
        const searchWithRuler = updateCoinSearchFilter(
          searchWithTheme,
          "ruler",
          rulerCode
        )

        const searchWithIssueYearRange = applyIssueYearRangeSearch(
          searchWithRuler,
          {
            fromYear,
            toYear,
          }
        )

        const searchWithFaceValueRange = applyFaceValueRangeSearch(
          searchWithIssueYearRange,
          {
            minValue,
            maxValue,
          }
        )

        return applyMeasurementRangeSearch(searchWithFaceValueRange, {
          minWeight,
          maxWeight,
          minDiameter,
          maxDiameter,
          minThickness,
          maxThickness,
        })
      },
    })
  }

  return (
    <div className="p-6">
      <HomeFilters
        catalogues={filterOptions.catalogues}
        compositions={filterOptions.compositions}
        currencies={filterOptions.currencies}
        distributions={filterOptions.distributions}
        edges={filterOptions.edges}
        engravers={filterOptions.engravers}
        issuers={filterOptions.issuers}
        mints={filterOptions.mints}
        orientations={filterOptions.orientations}
        rims={filterOptions.rims}
        rulers={filterOptions.rulers}
        shapes={filterOptions.shapes}
        techniques={filterOptions.techniques}
        themes={filterOptions.themes}
        selectedCatalogueCode={search.catalogue}
        selectedCompositionCode={search.composition}
        selectedCurrencyCode={search.currency}
        selectedDistributionCode={search.distribution}
        selectedDemonetization={search.demonetization}
        selectedEdgeCode={search.edge}
        selectedEngraverCode={search.engraver}
        selectedIssuerCode={search.issuer}
        selectedFromYear={search.fromYear}
        selectedMaxDiameter={search.maxDiameter}
        selectedMaxThickness={search.maxThickness}
        selectedMaxValue={search.maxValue}
        selectedMaxWeight={search.maxWeight}
        selectedMinDiameter={search.minDiameter}
        selectedMinThickness={search.minThickness}
        selectedMinValue={search.minValue}
        selectedMinWeight={search.minWeight}
        selectedMintCode={search.mint}
        selectedOrientationCode={search.orientation}
        selectedReferenceNumber={search.referenceNumber}
        selectedRimCode={search.rim}
        selectedRulerCode={search.ruler}
        selectedShapeCode={search.shape}
        selectedTechniqueCode={search.technique}
        selectedThemeCode={search.theme}
        selectedToYear={search.toYear}
        onFiltersChange={updateHomeFilters}
      />
      {coinCodeFilterConfigs
        .filter(
          ({ name }) =>
            name !== "catalogue" &&
            name !== "composition" &&
            name !== "currency" &&
            name !== "distribution" &&
            name !== "demonetization" &&
            name !== "edge" &&
            name !== "engraver" &&
            name !== "issuer" &&
            name !== "mint" &&
            name !== "orientation" &&
            name !== "rim" &&
            name !== "shape" &&
            name !== "technique" &&
            name !== "theme" &&
            name !== "ruler"
        )
        .map(({ name, getItems, ...comboboxProps }) => {
          const items = getItems(filterOptions)

          return (
            <NamedCodeFilterCombobox
              key={name}
              items={items}
              onValueChange={(option) => updateSearchFilter(name, option?.code)}
              selectedItem={findSelectedCodeOption(items, search[name])}
              {...comboboxProps}
            />
          )
        })}

      <ul className="space-y-4 py-4">
        {coins.map((coin) => {
          const measurementSummary = formatCoinMeasurements(coin.measurements)
          const mintNames = formatMintNames(coin.mints)

          return (
            <CoinListItem
              coin={coin}
              issueYearRangeLabel={formatIssueYearRangeLabel(
                coin.issueYearRange
              )}
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
