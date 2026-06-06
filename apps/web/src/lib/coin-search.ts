import type {
  CatalogueOption,
  CoinIssueYearRange,
  CoinMeasurements,
  DistributionOption,
  RulerOption,
} from "@workspace/db"
import { z } from "zod"

const optionalStringSchema = z.string().optional()

function normalizeOptionalIntegerInput(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined
  }

  return value
}

const optionalIntegerSchema = z.preprocess(
  normalizeOptionalIntegerInput,
  z.coerce.number().int().optional()
)

function normalizeOptionalDecimalInput(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined
  }

  return value
}

const optionalDecimalSchema = z.preprocess(
  normalizeOptionalDecimalInput,
  z.coerce.number().finite().optional()
)

export const coinSearchSchema = z.object({
  catalogue: optionalStringSchema,
  distribution: optionalStringSchema,
  fromYear: optionalIntegerSchema,
  issuer: optionalStringSchema,
  maxDiameter: optionalDecimalSchema,
  minDiameter: optionalDecimalSchema,
  referenceNumber: optionalStringSchema,
  ruler: optionalStringSchema,
  toYear: optionalIntegerSchema,
})

export const coinListInputSchema = z.object({
  catalogueCode: optionalStringSchema,
  distributionCode: optionalStringSchema,
  fromYear: optionalIntegerSchema,
  issuerCode: optionalStringSchema,
  maxDiameter: optionalDecimalSchema,
  minDiameter: optionalDecimalSchema,
  referenceNumber: optionalStringSchema,
  rulerCode: optionalStringSchema,
  toYear: optionalIntegerSchema,
})

export type CoinSearch = z.infer<typeof coinSearchSchema>
export type CoinListLoaderDeps = z.infer<typeof coinListInputSchema>
export type CoinSearchFilterName = keyof CoinSearch
export type IssueYearFilterName = keyof Pick<CoinSearch, "fromYear" | "toYear">
export type DiameterFilterName = keyof Pick<
  CoinSearch,
  "minDiameter" | "maxDiameter"
>
export type TextCoinSearchFilterName = Exclude<
  CoinSearchFilterName,
  "fromYear" | "toYear" | "minDiameter" | "maxDiameter"
>
export type IssueYearFilterValue =
  | CoinSearch[IssueYearFilterName]
  | FormDataEntryValue
  | null
  | undefined
export type DiameterFilterValue =
  | CoinSearch[DiameterFilterName]
  | FormDataEntryValue
  | null
  | undefined

const issueYearFilterNames = ["fromYear", "toYear"] as const
const diameterFilterNames = ["minDiameter", "maxDiameter"] as const

type OptionWithCode = { code: string }
type CatalogueOptionLabel = Pick<CatalogueOption, "title" | "code">
type DistributionOptionLabel = Pick<DistributionOption, "name" | "code">
type RulerOptionLabel = Pick<RulerOption, "name" | "group">
type CoinMeasurementField = keyof CoinMeasurements

const coinMeasurementDefinitions: ReadonlyArray<{
  field: CoinMeasurementField
  label: string
  unit: string
}> = [
  { field: "weight", label: "Weight", unit: "g" },
  { field: "diameter", label: "Diameter", unit: "mm" },
  { field: "thickness", label: "Thickness", unit: "mm" },
]

export function getCoinListLoaderDeps(search: CoinSearch): CoinListLoaderDeps {
  return {
    catalogueCode: search.catalogue,
    distributionCode: search.distribution,
    fromYear: search.fromYear,
    issuerCode: search.issuer,
    maxDiameter: search.maxDiameter,
    minDiameter: search.minDiameter,
    referenceNumber: search.referenceNumber,
    rulerCode: search.ruler,
    toYear: search.toYear,
  }
}

function findSelectedCodeOption<T extends OptionWithCode>(
  options: T[],
  selectedCode: string | undefined
): T | null {
  if (!selectedCode) {
    return null
  }

  const normalizedSelectedCode = selectedCode.toLowerCase()

  return (
    options.find(
      (option) => option.code.toLowerCase() === normalizedSelectedCode
    ) ?? null
  )
}

export function findSelectedCatalogueOption<T extends OptionWithCode>(
  catalogues: T[],
  selectedCatalogueCode: string | undefined
): T | null {
  return findSelectedCodeOption(catalogues, selectedCatalogueCode)
}

export function findSelectedDistributionOption<T extends OptionWithCode>(
  distributions: T[],
  selectedDistributionCode: string | undefined
): T | null {
  return findSelectedCodeOption(distributions, selectedDistributionCode)
}

export function updateCoinSearchFilter<K extends CoinSearchFilterName>(
  currentSearch: CoinSearch,
  filterName: K,
  filterValue: CoinSearch[K] | "" | undefined
): CoinSearch {
  const nextSearch = { ...currentSearch }

  if (filterValue === undefined || filterValue === "") {
    delete nextSearch[filterName]

    return nextSearch
  }

  nextSearch[filterName] = filterValue

  return nextSearch
}

function parseIssueYearFilterValue(value: IssueYearFilterValue) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : null
  }

  if (typeof value !== "string") {
    return undefined
  }

  const trimmedValue = value.trim()

  if (trimmedValue === "") {
    return undefined
  }

  if (!/^-?\d+$/.test(trimmedValue)) {
    return null
  }

  return Number.parseInt(trimmedValue, 10)
}

function parseDiameterFilterValue(value: DiameterFilterValue) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== "string") {
    return undefined
  }

  const trimmedValue = value.trim()

  if (trimmedValue === "") {
    return undefined
  }

  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmedValue)) {
    return null
  }

  return Number.parseFloat(trimmedValue)
}

export function applyIssueYearRangeSearch(
  currentSearch: CoinSearch,
  yearRange: Record<IssueYearFilterName, IssueYearFilterValue>
): CoinSearch {
  let nextSearch = currentSearch

  for (const filterName of issueYearFilterNames) {
    const parsedFilterValue = parseIssueYearFilterValue(yearRange[filterName])

    if (parsedFilterValue === null) {
      continue
    }

    nextSearch = updateCoinSearchFilter(
      nextSearch,
      filterName,
      parsedFilterValue
    )
  }

  return nextSearch
}

export function applyDiameterRangeSearch(
  currentSearch: CoinSearch,
  diameterRange: Record<DiameterFilterName, DiameterFilterValue>
): CoinSearch {
  let nextSearch = currentSearch

  for (const filterName of diameterFilterNames) {
    const parsedFilterValue = parseDiameterFilterValue(
      diameterRange[filterName]
    )

    if (parsedFilterValue === null) {
      continue
    }

    nextSearch = updateCoinSearchFilter(
      nextSearch,
      filterName,
      parsedFilterValue
    )
  }

  return nextSearch
}

export function getCatalogueOptionLabel(catalogue: CatalogueOptionLabel) {
  return `${catalogue.title} · ${catalogue.code}`
}

export function getDistributionOptionLabel(
  distribution: DistributionOptionLabel
) {
  return `${distribution.name} · ${distribution.code}`
}

export function getRulerOptionLabel(ruler: RulerOptionLabel) {
  return ruler.group ? `${ruler.name} · ${ruler.group.name}` : ruler.name
}

function formatAstronomicalYear(year: number) {
  const isCommonEra = year > 0
  const yearLabel = isCommonEra ? year : 1 - year
  const eraLabel = isCommonEra ? "CE" : "BCE"

  return `${yearLabel} ${eraLabel}`
}

export function formatIssueYearRangeLabel(
  issueYearRange: CoinIssueYearRange | null
) {
  if (!issueYearRange) {
    return "Issue years unknown"
  }

  const { minYear, maxYear } = issueYearRange
  const minYearLabel = formatAstronomicalYear(minYear)
  const maxYearLabel = formatAstronomicalYear(maxYear)

  if (minYear === maxYear) {
    return `Issue year ${minYearLabel}`
  }

  return `Issue years ${minYearLabel} to ${maxYearLabel}`
}

export function formatCoinMeasurementsLabel(
  measurements: CoinMeasurements
): string | null {
  const measurementLabels: string[] = []

  for (const { field, label, unit } of coinMeasurementDefinitions) {
    const value = measurements[field]

    if (value !== null) {
      measurementLabels.push(`${label} ${value} ${unit}`)
    }
  }

  if (measurementLabels.length === 0) {
    return null
  }

  return measurementLabels.join(" · ")
}
