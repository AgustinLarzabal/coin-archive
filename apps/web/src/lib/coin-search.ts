import type {
  CatalogueOption,
  CoinIssueYearRange,
  DistributionOption,
  RulerOption,
} from "@workspace/db"
import { z } from "zod"

const optionalStringSchema = z.string().optional()

function normalizeOptionalNumericInput(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined
  }

  return value
}

const optionalIntegerSchema = z.preprocess(
  normalizeOptionalNumericInput,
  z.coerce.number().int().optional()
)

const optionalPositiveNumberSchema = z.preprocess(
  normalizeOptionalNumericInput,
  z.coerce.number().positive().optional()
)

export const coinSearchSchema = z.object({
  catalogue: optionalStringSchema,
  distribution: optionalStringSchema,
  fromYear: optionalIntegerSchema,
  issuer: optionalStringSchema,
  maxDiameter: optionalPositiveNumberSchema,
  maxThickness: optionalPositiveNumberSchema,
  maxWeight: optionalPositiveNumberSchema,
  minDiameter: optionalPositiveNumberSchema,
  minThickness: optionalPositiveNumberSchema,
  minWeight: optionalPositiveNumberSchema,
  referenceNumber: optionalStringSchema,
  ruler: optionalStringSchema,
  toYear: optionalIntegerSchema,
})

export const coinListInputSchema = z.object({
  catalogueCode: optionalStringSchema,
  distributionCode: optionalStringSchema,
  fromYear: optionalIntegerSchema,
  issuerCode: optionalStringSchema,
  maxDiameter: optionalPositiveNumberSchema,
  maxThickness: optionalPositiveNumberSchema,
  maxWeight: optionalPositiveNumberSchema,
  minDiameter: optionalPositiveNumberSchema,
  minThickness: optionalPositiveNumberSchema,
  minWeight: optionalPositiveNumberSchema,
  referenceNumber: optionalStringSchema,
  rulerCode: optionalStringSchema,
  toYear: optionalIntegerSchema,
})

export type CoinSearch = z.infer<typeof coinSearchSchema>
export type CoinListLoaderDeps = z.infer<typeof coinListInputSchema>
export type CoinSearchFilterName = keyof CoinSearch
export type IssueYearFilterName = keyof Pick<CoinSearch, "fromYear" | "toYear">
export type MeasurementFilterName = keyof Pick<
  CoinSearch,
  | "minWeight"
  | "maxWeight"
  | "minDiameter"
  | "maxDiameter"
  | "minThickness"
  | "maxThickness"
>
export type TextCoinSearchFilterName = Exclude<
  CoinSearchFilterName,
  IssueYearFilterName | MeasurementFilterName
>
export type IssueYearFilterValue =
  | CoinSearch[IssueYearFilterName]
  | FormDataEntryValue
  | null
  | undefined
export type MeasurementFilterValue =
  | CoinSearch[MeasurementFilterName]
  | FormDataEntryValue
  | null
  | undefined

const issueYearFilterNames = ["fromYear", "toYear"] as const
const measurementFilterNames = [
  "minWeight",
  "maxWeight",
  "minDiameter",
  "maxDiameter",
  "minThickness",
  "maxThickness",
] as const

type OptionWithCode = { code: string }
type CatalogueOptionLabel = Pick<CatalogueOption, "title" | "code">
type DistributionOptionLabel = Pick<DistributionOption, "name" | "code">
type RulerOptionLabel = Pick<RulerOption, "name" | "group">

export function getCoinListLoaderDeps(search: CoinSearch): CoinListLoaderDeps {
  return {
    catalogueCode: search.catalogue,
    distributionCode: search.distribution,
    fromYear: search.fromYear,
    issuerCode: search.issuer,
    maxDiameter: search.maxDiameter,
    maxThickness: search.maxThickness,
    maxWeight: search.maxWeight,
    minDiameter: search.minDiameter,
    minThickness: search.minThickness,
    minWeight: search.minWeight,
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

function parseMeasurementFilterValue(value: MeasurementFilterValue) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null
  }

  if (typeof value !== "string") {
    return undefined
  }

  const trimmedValue = value.trim()

  if (trimmedValue === "") {
    return undefined
  }

  if (!/^\d+(\.\d+)?$/.test(trimmedValue)) {
    return null
  }

  const parsedValue = Number.parseFloat(trimmedValue)

  return parsedValue > 0 ? parsedValue : null
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

export function applyMeasurementRangeSearch(
  currentSearch: CoinSearch,
  measurementRange: Record<MeasurementFilterName, MeasurementFilterValue>
): CoinSearch {
  let nextSearch = currentSearch

  for (const filterName of measurementFilterNames) {
    const parsedFilterValue = parseMeasurementFilterValue(
      measurementRange[filterName]
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

const measurementFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMeasurementLabel(
  label: string,
  value: number | null,
  unit: string
) {
  if (value === null) {
    return null
  }

  return `${label} ${measurementFormatter.format(value)} ${unit}`
}
