import type {
  CatalogueOption,
  CoinRecordMint,
  CoinIssueYearRange,
  CompositionOption,
  CurrencyOption,
  DistributionOption,
  MintOption,
  OrientationOption,
  RimOption,
  RulerOption,
  ShapeOption,
  ThemeOption,
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
  composition: optionalStringSchema,
  currency: optionalStringSchema,
  distribution: optionalStringSchema,
  fromYear: optionalIntegerSchema,
  issuer: optionalStringSchema,
  maxDiameter: optionalPositiveNumberSchema,
  maxThickness: optionalPositiveNumberSchema,
  maxWeight: optionalPositiveNumberSchema,
  maxValue: optionalPositiveNumberSchema,
  mint: optionalStringSchema,
  minDiameter: optionalPositiveNumberSchema,
  minThickness: optionalPositiveNumberSchema,
  minWeight: optionalPositiveNumberSchema,
  minValue: optionalPositiveNumberSchema,
  orientation: optionalStringSchema,
  rim: optionalStringSchema,
  referenceNumber: optionalStringSchema,
  ruler: optionalStringSchema,
  shape: optionalStringSchema,
  theme: optionalStringSchema,
  toYear: optionalIntegerSchema,
})

export const coinListInputSchema = z.object({
  catalogueCode: optionalStringSchema,
  compositionCode: optionalStringSchema,
  currencyCode: optionalStringSchema,
  distributionCode: optionalStringSchema,
  fromYear: optionalIntegerSchema,
  issuerCode: optionalStringSchema,
  maxDiameter: optionalPositiveNumberSchema,
  maxThickness: optionalPositiveNumberSchema,
  maxWeight: optionalPositiveNumberSchema,
  maxValue: optionalPositiveNumberSchema,
  mintCode: optionalStringSchema,
  minDiameter: optionalPositiveNumberSchema,
  minThickness: optionalPositiveNumberSchema,
  minWeight: optionalPositiveNumberSchema,
  minValue: optionalPositiveNumberSchema,
  orientationCode: optionalStringSchema,
  rimCode: optionalStringSchema,
  referenceNumber: optionalStringSchema,
  rulerCode: optionalStringSchema,
  shapeCode: optionalStringSchema,
  themeCode: optionalStringSchema,
  toYear: optionalIntegerSchema,
})

export type CoinSearch = z.infer<typeof coinSearchSchema>
export type CoinListLoaderDeps = z.infer<typeof coinListInputSchema>
export type CoinSearchFilterName = keyof CoinSearch
export type IssueYearFilterName = keyof Pick<CoinSearch, "fromYear" | "toYear">
export type FaceValueFilterName = keyof Pick<
  CoinSearch,
  "minValue" | "maxValue"
>
export type MeasurementFilterName = keyof Pick<
  CoinSearch,
  | "minWeight"
  | "maxWeight"
  | "minDiameter"
  | "maxDiameter"
  | "minThickness"
  | "maxThickness"
>
export type PositiveNumberFilterName =
  | MeasurementFilterName
  | FaceValueFilterName
export type TextCoinSearchFilterName = Exclude<
  CoinSearchFilterName,
  IssueYearFilterName | MeasurementFilterName | FaceValueFilterName
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
export type PositiveNumberFilterValue =
  | CoinSearch[PositiveNumberFilterName]
  | FormDataEntryValue
  | null
  | undefined
export type FaceValueFilterValue =
  | CoinSearch[FaceValueFilterName]
  | FormDataEntryValue
  | null
  | undefined

const issueYearFilterNames = ["fromYear", "toYear"] as const
const faceValueFilterNames = ["minValue", "maxValue"] as const
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
type CompositionOptionLabel = Pick<CompositionOption, "name">
type NamedCodeOptionLabel = { name: string; code: string }
type CurrencyOptionLabel = Pick<CurrencyOption, keyof NamedCodeOptionLabel>
type DistributionOptionLabel = Pick<
  DistributionOption,
  keyof NamedCodeOptionLabel
>
type MintOptionLabel = Pick<MintOption, keyof NamedCodeOptionLabel>
type OrientationOptionLabel = Pick<
  OrientationOption,
  keyof NamedCodeOptionLabel
>
type RimOptionLabel = Pick<RimOption, keyof NamedCodeOptionLabel>
type RulerOptionLabel = Pick<RulerOption, "name" | "group">
type ShapeOptionLabel = Pick<ShapeOption, keyof NamedCodeOptionLabel>
type ThemeOptionLabel = Pick<ThemeOption, keyof NamedCodeOptionLabel>
type CoinMintLabel = Pick<CoinRecordMint, "name">

type ParsedFilterValue<T> = T | null | undefined

export function isCodeOptionEqual<T extends OptionWithCode>(left: T, right: T) {
  return left.code === right.code
}

export function getCoinListLoaderDeps(search: CoinSearch): CoinListLoaderDeps {
  return {
    catalogueCode: search.catalogue,
    compositionCode: search.composition,
    currencyCode: search.currency,
    distributionCode: search.distribution,
    fromYear: search.fromYear,
    issuerCode: search.issuer,
    maxDiameter: search.maxDiameter,
    maxThickness: search.maxThickness,
    maxWeight: search.maxWeight,
    maxValue: search.maxValue,
    mintCode: search.mint,
    minDiameter: search.minDiameter,
    minThickness: search.minThickness,
    minWeight: search.minWeight,
    minValue: search.minValue,
    orientationCode: search.orientation,
    ...(search.rim === undefined ? {} : { rimCode: search.rim }),
    referenceNumber: search.referenceNumber,
    rulerCode: search.ruler,
    ...(search.shape === undefined ? {} : { shapeCode: search.shape }),
    themeCode: search.theme,
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

export const findSelectedCatalogueOption: <T extends OptionWithCode>(
  catalogues: T[],
  selectedCatalogueCode: string | undefined
) => T | null = findSelectedCodeOption

export const findSelectedCompositionOption: <T extends OptionWithCode>(
  compositions: T[],
  selectedCompositionCode: string | undefined
) => T | null = findSelectedCodeOption

export const findSelectedCurrencyOption: <T extends OptionWithCode>(
  currencies: T[],
  selectedCurrencyCode: string | undefined
) => T | null = findSelectedCodeOption

export const findSelectedDistributionOption: <T extends OptionWithCode>(
  distributions: T[],
  selectedDistributionCode: string | undefined
) => T | null = findSelectedCodeOption

export const findSelectedMintOption: <T extends OptionWithCode>(
  mints: T[],
  selectedMintCode: string | undefined
) => T | null = findSelectedCodeOption

export const findSelectedOrientationOption: <T extends OptionWithCode>(
  orientations: T[],
  selectedOrientationCode: string | undefined
) => T | null = findSelectedCodeOption

export const findSelectedRimOption: <T extends OptionWithCode>(
  rims: T[],
  selectedRimCode: string | undefined
) => T | null = findSelectedCodeOption

export const findSelectedShapeOption: <T extends OptionWithCode>(
  shapes: T[],
  selectedShapeCode: string | undefined
) => T | null = findSelectedCodeOption

export const findSelectedThemeOption: <T extends OptionWithCode>(
  themes: T[],
  selectedThemeCode: string | undefined
) => T | null = findSelectedCodeOption

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

function parsePositiveNumberFilterValue(value: PositiveNumberFilterValue) {
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

function applyParsedRangeSearch<K extends CoinSearchFilterName, V>(
  currentSearch: CoinSearch,
  filterNames: readonly K[],
  requestedFilters: Record<K, V>,
  parseFilterValue: (value: V) => ParsedFilterValue<CoinSearch[K]>
): CoinSearch {
  let nextSearch = currentSearch

  for (const filterName of filterNames) {
    const parsedFilterValue = parseFilterValue(requestedFilters[filterName])

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

export function applyIssueYearRangeSearch(
  currentSearch: CoinSearch,
  yearRange: Record<IssueYearFilterName, IssueYearFilterValue>
): CoinSearch {
  return applyParsedRangeSearch(
    currentSearch,
    issueYearFilterNames,
    yearRange,
    parseIssueYearFilterValue
  )
}

export function applyMeasurementRangeSearch(
  currentSearch: CoinSearch,
  measurementRange: Record<MeasurementFilterName, MeasurementFilterValue>
): CoinSearch {
  return applyParsedRangeSearch(
    currentSearch,
    measurementFilterNames,
    measurementRange,
    parsePositiveNumberFilterValue
  )
}

export function applyFaceValueRangeSearch(
  currentSearch: CoinSearch,
  faceValueRange: Record<FaceValueFilterName, PositiveNumberFilterValue>
): CoinSearch {
  return applyParsedRangeSearch(
    currentSearch,
    faceValueFilterNames,
    faceValueRange,
    parsePositiveNumberFilterValue
  )
}

export function getCatalogueOptionLabel(catalogue: CatalogueOptionLabel) {
  return `${catalogue.title} · ${catalogue.code}`
}

function getNamedCodeOptionLabel(option: NamedCodeOptionLabel) {
  return `${option.name} · ${option.code}`
}

export function getDistributionOptionLabel(
  distribution: DistributionOptionLabel
) {
  return getNamedCodeOptionLabel(distribution)
}

export function getCompositionOptionLabel(composition: CompositionOptionLabel) {
  return composition.name
}

export function getCurrencyOptionLabel(currency: CurrencyOptionLabel) {
  return getNamedCodeOptionLabel(currency)
}

export const getMintOptionLabel: (mint: MintOptionLabel) => string =
  getNamedCodeOptionLabel

export const getOrientationOptionLabel: (
  orientation: OrientationOptionLabel
) => string = getNamedCodeOptionLabel

export const getRimOptionLabel: (rim: RimOptionLabel) => string =
  getNamedCodeOptionLabel

export const getShapeOptionLabel: (shape: ShapeOptionLabel) => string =
  getNamedCodeOptionLabel

export const getThemeOptionLabel: (theme: ThemeOptionLabel) => string =
  getNamedCodeOptionLabel

export function getRulerOptionLabel(ruler: RulerOptionLabel) {
  return ruler.group ? `${ruler.name} · ${ruler.group.name}` : ruler.name
}

export function formatMintNames(mints: CoinMintLabel[]) {
  return mints.map(({ name }) => name).join(", ")
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
