import { z } from "zod"

import { errorResponseSchema, historicalYearSchema } from "./common.js"

export const FACE_VALUE_AMOUNT_QUERY_PATTERN =
  "^(?:[1-9]\\d{0,17}|0\\.\\d{0,11}[1-9]|[1-9]\\d{0,17}\\.\\d{0,11}[1-9])$"

export const faceValueAmountQuerySchema = z
  .string()
  .regex(new RegExp(FACE_VALUE_AMOUNT_QUERY_PATTERN))

export const measurementQuerySchema = (precision: 2 | 3) =>
  z
    .string()
    .regex(new RegExp(`^(?:[1-9]\\d{0,17}|0)(?:\\.\\d{1,${precision}})?$`))
    .refine((value) => Number(value) > 0)

export function measurementMinExceedsMax(min: string, max: string) {
  const scaled = (value: string) => {
    const [whole, fraction = ""] = value.split(".")
    return BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"))
  }
  return scaled(min) > scaled(max)
}

function coinListMeasurementRangeSchema(precision: 2 | 3) {
  const valueSchema = measurementQuerySchema(precision)
  return z.string().refine((value) => {
    const bounds = value.split("-")
    return (
      bounds.length <= 2 &&
      bounds.every((bound) => valueSchema.safeParse(bound).success) &&
      (bounds.length === 1 || !measurementMinExceedsMax(bounds[0], bounds[1]))
    )
  })
}

const COIN_LIST_SIZE_VALUE_QUERY_PATTERN =
  "(?:[1-9]\\d{0,17}(?:\\.\\d{1,2})?|0\\.(?:[1-9]\\d?|0[1-9]))"
export const COIN_LIST_SIZE_QUERY_PATTERN = `^${COIN_LIST_SIZE_VALUE_QUERY_PATTERN}(?:-${COIN_LIST_SIZE_VALUE_QUERY_PATTERN})?$`
export const coinListSizeSchema = coinListMeasurementRangeSchema(2)
export type CoinListSize = z.infer<typeof coinListSizeSchema>

export function coinListSizeToInterval(size: CoinListSize) {
  const [min, max = min] = size.split("-")
  return { min, max }
}

export const COIN_LIST_THICKNESS_QUERY_PATTERN = COIN_LIST_SIZE_QUERY_PATTERN
export const coinListThicknessSchema = coinListSizeSchema
export type CoinListThickness = z.infer<typeof coinListThicknessSchema>
export const coinListThicknessToInterval = coinListSizeToInterval

const COIN_LIST_WEIGHT_VALUE_QUERY_PATTERN =
  "(?:[1-9]\\d{0,17}(?:\\.\\d{1,3})?|0\\.(?:[1-9]\\d{0,2}|0[1-9]\\d?|00[1-9]))"
export const COIN_LIST_WEIGHT_QUERY_PATTERN = `^${COIN_LIST_WEIGHT_VALUE_QUERY_PATTERN}(?:-${COIN_LIST_WEIGHT_VALUE_QUERY_PATTERN})?$`
export const coinListWeightSchema = coinListMeasurementRangeSchema(3)
export type CoinListWeight = z.infer<typeof coinListWeightSchema>
export const coinListWeightToInterval = coinListSizeToInterval
export const COIN_LIST_DEFAULT_PAGE = 1
export const COIN_LIST_DEFAULT_PAGE_SIZE = 24
export const COIN_LIST_MAX_PAGE_SIZE = 100

export const coinListPageSchema = z.int().min(1)

const CANONICAL_ISSUE_YEAR_PATTERN = "-?[1-9]\\d*"
export const COIN_LIST_YEAR_QUERY_PATTERN = `^(?:${CANONICAL_ISSUE_YEAR_PATTERN}|${CANONICAL_ISSUE_YEAR_PATTERN}-${CANONICAL_ISSUE_YEAR_PATTERN})$`
const canonicalIssueYearPattern = new RegExp(
  `^${CANONICAL_ISSUE_YEAR_PATTERN}$`
)
const canonicalCoinListYearRangePattern = new RegExp(
  `^(${CANONICAL_ISSUE_YEAR_PATTERN})-(${CANONICAL_ISSUE_YEAR_PATTERN})$`
)

function parseCanonicalCoinListYearRange(range: string) {
  const match = canonicalCoinListYearRangePattern.exec(range)
  if (!match) return undefined

  return {
    firstIssueYear: Number(match[1]),
    lastIssueYear: Number(match[2]),
  }
}

const canonicalCoinListYearRangeSchema = z.string().refine((range) => {
  const interval = parseCanonicalCoinListYearRange(range)
  return (
    interval !== undefined &&
    Number.isSafeInteger(interval.firstIssueYear) &&
    Number.isSafeInteger(interval.lastIssueYear) &&
    interval.firstIssueYear <= interval.lastIssueYear
  )
})
export const coinListYearSchema = z.union([
  historicalYearSchema,
  canonicalCoinListYearRangeSchema,
])
export type CoinListYear = z.infer<typeof coinListYearSchema>
export const coinListPageSizeSchema = z
  .int()
  .min(1)
  .max(COIN_LIST_MAX_PAGE_SIZE)
const decimalIntegerQuerySchema = z.string().regex(/^\d+$/).transform(Number)
export const coinListYearQuerySchema = z
  .string()
  .transform((year) =>
    canonicalIssueYearPattern.test(year) ? Number(year) : year
  )
  .pipe(coinListYearSchema)
export const coinListPageQuerySchema =
  decimalIntegerQuerySchema.pipe(coinListPageSchema)
export const coinListPageSizeQuerySchema = decimalIntegerQuerySchema.pipe(
  coinListPageSizeSchema
)

export function coinListYearToInterval(year: CoinListYear) {
  if (typeof year === "number") {
    return { firstIssueYear: year, lastIssueYear: year }
  }

  const interval = parseCanonicalCoinListYearRange(year)
  if (!interval) throw new RangeError("Issue Year range is invalid")
  return interval
}

export const invalidFaceValueFilterErrorSchema = errorResponseSchema(
  "invalid_face_value_filter",
  "Face Value filter is invalid"
)

export const invalidMeasurementFilterErrorSchema = errorResponseSchema(
  "invalid_measurement_filter",
  "Measurement filter is invalid"
)

export const invalidYearErrorSchema = errorResponseSchema(
  "invalid_year",
  "Issue Year is invalid"
)

export const invalidPaginationErrorSchema = errorResponseSchema(
  "invalid_pagination",
  "Pagination is invalid"
)
