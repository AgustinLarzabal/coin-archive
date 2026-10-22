import { z } from "zod"

export const operationalOkResponseSchema = z.strictObject({
  status: z.literal("ok"),
})

export type OperationalOkResponse = z.infer<typeof operationalOkResponseSchema>

export const operationalUnavailableResponseSchema = z.strictObject({
  status: z.literal("unavailable"),
})

export type OperationalUnavailableResponse = z.infer<
  typeof operationalUnavailableResponseSchema
>

export const coinIdSchema = z.uuid()

export const issuerCodeSchema = z
  .string()
  .regex(/^(?:[A-Z]{2}|[A-Z0-9-]{3,12})$/)

export const engraverSlugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const rulingAuthoritySlugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const mintSlugSchema = rulingAuthoritySlugSchema

const trimmedDisplayTextSchema = (maximumLength: number) =>
  z
    .string()
    .min(1)
    .max(maximumLength)
    .regex(/^\S(?:[\s\S]*\S)?$/)

export function isIsoIssuerCode(code: string) {
  return /^[A-Z]{2}$/.test(code)
}

export const issuerResponseSchema = z.strictObject({
  name: z.string().min(1).max(200),
  code: issuerCodeSchema,
})

export type IssuerResponse = z.infer<typeof issuerResponseSchema>

export const issuerListResponseSchema = z.strictObject({
  issuers: z.array(issuerResponseSchema),
})

export type IssuerListResponse = z.infer<typeof issuerListResponseSchema>

const issueYearSchema = z
  .int()
  .refine((year) => year !== 0, "Issue Year cannot be zero")

const firstIssueYearSchema = issueYearSchema.meta({
  description:
    "Signed conventional Issue Year: negative values are BCE, positive values are CE, and zero is invalid. Must be less than or equal to lastIssueYear.",
  not: { const: 0 },
})

const lastIssueYearSchema = issueYearSchema.meta({
  description:
    "Signed conventional Issue Year: negative values are BCE, positive values are CE, and zero is invalid. Must be greater than or equal to firstIssueYear.",
  not: { const: 0 },
})

export const coinDistributionSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export type CoinDistribution = z.infer<typeof coinDistributionSchema>

export const distributionSlugSchema = coinDistributionSchema

export const distributionListItemResponseSchema = z.strictObject({
  slug: distributionSlugSchema,
  name: trimmedDisplayTextSchema(200),
})

export type DistributionListItemResponse = z.infer<
  typeof distributionListItemResponseSchema
>

export const distributionListResponseSchema = z.strictObject({
  distributions: z.array(distributionListItemResponseSchema),
})

export type DistributionListResponse = z.infer<
  typeof distributionListResponseSchema
>

const coinResponseShape = {
  id: coinIdSchema,
  title: z.string().min(1).max(200),
  distribution: coinDistributionSchema,
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

export const currencySlugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const FACE_VALUE_AMOUNT_QUERY_PATTERN =
  "^(?:[1-9]\\d{0,17}|0\\.\\d{0,11}[1-9]|[1-9]\\d{0,17}\\.\\d{0,11}[1-9])$"

export const faceValueAmountQuerySchema = z
  .string()
  .regex(new RegExp(FACE_VALUE_AMOUNT_QUERY_PATTERN))

export const currencyResponseSchema = z.strictObject({
  slug: currencySlugSchema,
  name: trimmedDisplayTextSchema(200),
  fullName: trimmedDisplayTextSchema(403),
})

export type CurrencyResponse = z.infer<typeof currencyResponseSchema>

export const currencyListResponseSchema = z.strictObject({
  currencies: z.array(currencyResponseSchema),
})

export type CurrencyListResponse = z.infer<typeof currencyListResponseSchema>

export const coinFaceValueResponseSchema = z.strictObject({
  label: trimmedDisplayTextSchema(200),
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
  issueYearSchema,
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

export const engraverResponseSchema = z.strictObject({
  slug: engraverSlugSchema,
  fullName: z.string().min(1).max(200),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type EngraverResponse = z.infer<typeof engraverResponseSchema>

export const engraverListItemResponseSchema = z.strictObject({
  slug: engraverSlugSchema,
  fullName: z.string().min(1).max(200),
})

export type EngraverListItemResponse = z.infer<
  typeof engraverListItemResponseSchema
>

export const engraverListResponseSchema = z.strictObject({
  engravers: z.array(engraverListItemResponseSchema),
})

export type EngraverListResponse = z.infer<typeof engraverListResponseSchema>

export const rulingAuthorityListItemResponseSchema = z.strictObject({
  slug: rulingAuthoritySlugSchema,
  name: trimmedDisplayTextSchema(200),
})

export type RulingAuthorityListItemResponse = z.infer<
  typeof rulingAuthorityListItemResponseSchema
>

export const rulingAuthorityListResponseSchema = z.strictObject({
  rulers: z.array(rulingAuthorityListItemResponseSchema),
})

export type RulingAuthorityListResponse = z.infer<
  typeof rulingAuthorityListResponseSchema
>

export const coinSurfaceWithEngraversResponseSchema =
  coinSurfaceResponseSchema.extend({
    engravers: z.array(engraverResponseSchema),
  })

export type CoinSurfaceWithEngraversResponse = z.infer<
  typeof coinSurfaceWithEngraversResponseSchema
>

export const rulingAuthorityAttributionResponseSchema = z.strictObject({
  slug: rulingAuthoritySlugSchema,
  name: trimmedDisplayTextSchema(200),
  role: trimmedDisplayTextSchema(100),
  tenure: trimmedDisplayTextSchema(200).nullable(),
})

export type RulingAuthorityAttributionResponse = z.infer<
  typeof rulingAuthorityAttributionResponseSchema
>

export const mintResponseSchema = z
  .strictObject({
    id: z.uuid(),
    slug: mintSlugSchema,
    name: trimmedDisplayTextSchema(200),
    place: trimmedDisplayTextSchema(200),
    country: issuerResponseSchema,
    startYear: issueYearSchema.nullable().meta({
      description:
        "Inclusive signed BCE/CE year without year zero; null when unknown.",
      not: { const: 0 },
    }),
    endYear: issueYearSchema.nullable().meta({
      description:
        "Inclusive signed BCE/CE year without year zero; null when unknown or ongoing.",
      not: { const: 0 },
    }),
    operating: z.boolean().nullable().meta({
      description:
        "True if operating, false if closed, null if status is unknown. A known end year requires false.",
    }),
  })
  .refine(
    ({ startYear, endYear, operating }) =>
      (startYear === null || endYear === null || startYear <= endYear) &&
      (operating !== true || endYear === null) &&
      (endYear === null || operating === false),
    "Mint Operation Period is invalid"
  )

export type MintResponse = z.infer<typeof mintResponseSchema>

export const mintListResponseSchema = z.strictObject({
  mints: z.array(mintResponseSchema),
})

export type MintListResponse = z.infer<typeof mintListResponseSchema>

export const coinDetailResponseSchema = z
  .strictObject({
    ...coinResponseShape,
    distributionName: trimmedDisplayTextSchema(200),
    faceValue: coinFaceValueResponseSchema.nullable(),
    obverse: coinSurfaceWithEngraversResponseSchema,
    reverse: coinSurfaceWithEngraversResponseSchema,
    edge: coinSurfaceResponseSchema,
    rulers: z.array(rulingAuthorityAttributionResponseSchema),
    mints: z.array(mintResponseSchema),
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

function errorResponseSchema<
  const TCode extends string,
  const TMessage extends string,
>(code: TCode, message: TMessage) {
  return z.object({
    error: z.object({
      code: z.literal(code),
      message: z.literal(message),
    }),
  })
}

export const invalidCoinIdErrorSchema = errorResponseSchema(
  "invalid_coin_id",
  "Coin ID must be a valid UUID"
)

export const invalidIssuerCodeErrorSchema = errorResponseSchema(
  "invalid_issuer_code",
  "Issuer Code is invalid"
)

export const invalidDistributionErrorSchema = errorResponseSchema(
  "invalid_distribution",
  "Coin Distribution is invalid"
)

export const invalidEngraverSlugErrorSchema = errorResponseSchema(
  "invalid_engraver_slug",
  "Engraver Slug is invalid"
)

export const invalidRulingAuthoritySlugErrorSchema = errorResponseSchema(
  "invalid_ruler_slug",
  "Ruling Authority Slug is invalid"
)

export const invalidMintSlugErrorSchema = errorResponseSchema(
  "invalid_mint_slug",
  "Mint Slug is invalid"
)

export const invalidCurrencySlugErrorSchema = errorResponseSchema(
  "invalid_currency_slug",
  "Currency Slug is invalid"
)

export const invalidFaceValueFilterErrorSchema = errorResponseSchema(
  "invalid_face_value_filter",
  "Face Value filter is invalid"
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

export const internalErrorSchema = errorResponseSchema(
  "internal_error",
  "Internal server error"
)
