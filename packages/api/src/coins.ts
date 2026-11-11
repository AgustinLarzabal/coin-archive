import { z } from "zod"

import {
  displayTextSchema,
  errorResponseSchema,
  historicalYearSchema,
  namedSlugResponseSchema,
  slugSchema,
} from "./common.js"
import { currencyResponseSchema } from "./currencies.js"
import { engraverResponseSchema } from "./engravers.js"
import { issuerResponseSchema } from "./issuers.js"
import { mintResponseSchema } from "./mints.js"
import { rulingAuthorityResponseSchema } from "./ruling-authorities.js"

const firstIssueYearSchema = historicalYearSchema.meta({
  description:
    "Signed conventional Issue Year: negative values are BCE, positive values are CE, and zero is invalid. Must be less than or equal to lastIssueYear.",
  not: { const: 0 },
})

const lastIssueYearSchema = historicalYearSchema.meta({
  description:
    "Signed conventional Issue Year: negative values are BCE, positive values are CE, and zero is invalid. Must be greater than or equal to firstIssueYear.",
  not: { const: 0 },
})

export const coinIdSchema = z.uuid()
const coinResponseShape = {
  id: coinIdSchema,
  title: z.string().min(1).max(200),
  distribution: slugSchema,
  firstIssueYear: firstIssueYearSchema,
  lastIssueYear: lastIssueYearSchema,
  issuer: issuerResponseSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}

function hasOrderedIssuePeriod(coin: {
  firstIssueYear: number
  lastIssueYear: number
}) {
  return coin.firstIssueYear <= coin.lastIssueYear
}
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
export const coinFaceValueResponseSchema = z.strictObject({
  label: displayTextSchema(200),
  numericValue: z.number().positive().meta({
    description:
      "Positive JSON numeric value derived from a fixed-precision decimal with up to 18 integer and 12 fractional digits; repeating historical values are curated fixed-precision approximations.",
  }),
  currency: currencyResponseSchema,
})

export type CoinFaceValueResponse = z.infer<typeof coinFaceValueResponseSchema>

export const coinListItemResponseSchema = z
  .strictObject({
    ...coinResponseShape,
    faceValue: coinFaceValueResponseSchema.nullable(),
    obverseImageUrl: z.url().nullable(),
    reverseImageUrl: z.url().nullable(),
  })
  .refine(hasOrderedIssuePeriod, "Issue Period must be ordered")

export type CoinListItemResponse = z.infer<typeof coinListItemResponseSchema>
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

export const coinListPaginationResponseSchema = z.strictObject({
  page: coinListPageSchema,
  pageSize: coinListPageSizeSchema,
  totalItems: z.int().min(0),
  totalPages: z.int().min(0),
})

export type CoinListPaginationResponse = z.infer<
  typeof coinListPaginationResponseSchema
>
export const coinSurfaceResponseSchema = z.strictObject({
  description: z.string().min(1).max(10_000).nullable(),
  imageUrl: z.url().nullable(),
  createdAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime().nullable(),
})

export type CoinSurfaceResponse = z.infer<typeof coinSurfaceResponseSchema>
export const coinSurfaceWithEngraversResponseSchema =
  coinSurfaceResponseSchema.extend({
    engravers: z.array(engraverResponseSchema),
  })

export type CoinSurfaceWithEngraversResponse = z.infer<
  typeof coinSurfaceWithEngraversResponseSchema
>
export const coinDetailResponseSchema = z
  .strictObject({
    ...coinResponseShape,
    orientation: displayTextSchema(200).nullable(),
    shape: slugSchema.nullable(),
    shapeName: displayTextSchema(200).nullable(),
    technique: slugSchema.nullable(),
    techniqueName: displayTextSchema(200).nullable(),
    distributionName: displayTextSchema(200),
    composition: slugSchema.nullable(),
    compositionName: displayTextSchema(200).nullable(),
    compositionDetail: displayTextSchema(10_000).nullable(),
    demonetized: z.boolean().nullable().meta({
      description:
        "True for confirmed formal withdrawal of legal-tender status, false for confirmed absence of withdrawal, null when unverified.",
    }),
    size: z
      .number()
      .positive()
      .nullable()
      .meta({ description: "Coin Size in millimetres; null when unknown." }),
    thickness: z.number().positive().nullable().meta({
      description: "Coin Thickness in millimetres; null when unknown.",
    }),
    weight: z
      .number()
      .positive()
      .nullable()
      .meta({ description: "Coin Weight in grams; null when unknown." }),
    faceValue: coinFaceValueResponseSchema.nullable(),
    obverse: coinSurfaceWithEngraversResponseSchema,
    reverse: coinSurfaceWithEngraversResponseSchema,
    edge: coinSurfaceResponseSchema,
    rulers: z.array(rulingAuthorityResponseSchema),
    mints: z.array(mintResponseSchema),
    tags: z.array(namedSlugResponseSchema),
  })
  .refine(hasOrderedIssuePeriod, "Issue Period must be ordered")

export type CoinDetailResponse = z.infer<typeof coinDetailResponseSchema>

export const coinListResponseSchema = z.strictObject({
  coins: z.array(coinListItemResponseSchema).max(COIN_LIST_MAX_PAGE_SIZE),
  pagination: coinListPaginationResponseSchema,
})

export type CoinListResponse = z.infer<typeof coinListResponseSchema>

export const missingCoinSurfaceResponse: Readonly<CoinSurfaceResponse> =
  Object.freeze({
    description: null,
    imageUrl: null,
    createdAt: null,
    updatedAt: null,
  })

export const missingCoinSurfaceWithEngraversResponse: Readonly<CoinSurfaceWithEngraversResponse> =
  Object.freeze({ ...missingCoinSurfaceResponse, engravers: [] })
export const invalidCoinIdErrorSchema = errorResponseSchema(
  "invalid_coin_id",
  "Coin ID must be a valid UUID"
)
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

export const coinNotFoundErrorSchema = errorResponseSchema(
  "coin_not_found",
  "Coin not found"
)
