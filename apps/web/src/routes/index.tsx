import { createFileRoute, getRouteApi } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { FormEvent } from "react"
import type { CoinMeasurements } from "@workspace/db"
import {
  applyFaceValueRangeSearch,
  applyMeasurementRangeSearch,
  applyIssueYearRangeSearch,
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
  CoinSearch,
  FaceValueFilterName,
  MeasurementFilterName,
  PositiveNumberFilterName,
  PositiveNumberFilterValue,
  TextCoinSearchFilterName,
} from "../lib/coin-search"
import { coinCodeFilterConfigs } from "../lib/coin-filter-configs"
import { CoinListItem } from "../components/coin-list-item"
import { NamedCodeFilterCombobox } from "../components/named-code-filter-combobox"

import { Input } from "@workspace/ui/components/input"
import { HomeFilters } from "@/components/home-filters"

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
    issuerCode,
    rulerCode,
  }: {
    issuerCode: string | undefined
    rulerCode: string | undefined
  }) {
    await navigate({
      resetScroll: false,
      search: (currentSearch) =>
        updateCoinSearchFilter(
          updateCoinSearchFilter(currentSearch, "issuer", issuerCode),
          "ruler",
          rulerCode
        ),
    })
  }

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
      resetScroll: false,
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
        resetScroll: false,
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
    <div className="p-5">
      <HomeFilters
        issuers={filterOptions.issuers}
        rulers={filterOptions.rulers}
        selectedIssuerCode={search.issuer}
        selectedRulerCode={search.ruler}
        onFiltersChange={updateHomeFilters}
      />
      {coinCodeFilterConfigs
        .filter(({ name }) => name !== "issuer" && name !== "ruler")
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

      <form
        className="flex items-end gap-2 py-2"
        onSubmit={updateReferenceNumberFromForm}
      >
        <Input
          aria-label="Filter by reference number"
          className="md:max-w-40"
          defaultValue={search.referenceNumber ?? ""}
          key={`reference-number-${search.referenceNumber ?? ""}`}
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
          defaultValue={search.fromYear?.toString() ?? ""}
          key={`from-year-${search.fromYear ?? ""}`}
          name="fromYear"
          placeholder="From year"
          type="number"
        />
        <Input
          aria-label="Filter to issue year"
          defaultValue={search.toYear?.toString() ?? ""}
          key={`to-year-${search.toYear ?? ""}`}
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
            defaultValue={search[name]?.toString() ?? ""}
            key={`${name}-${search[name] ?? ""}`}
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
            defaultValue={search[name]?.toString() ?? ""}
            key={`${name}-${search[name] ?? ""}`}
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
