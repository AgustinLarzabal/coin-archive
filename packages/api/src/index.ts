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

const coinResponseShape = {
  id: coinIdSchema,
  title: z.string().min(1).max(200),
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

export const coinListItemResponseSchema = z
  .strictObject({
    ...coinResponseShape,
    obverseImageUrl: z.url().nullable(),
    reverseImageUrl: z.url().nullable(),
  })
  .refine(hasOrderedIssuePeriod, "Issue Period must be ordered")

export type CoinListItemResponse = z.infer<typeof coinListItemResponseSchema>

export const COIN_LIST_DEFAULT_PAGE = 1
export const COIN_LIST_DEFAULT_PAGE_SIZE = 24
export const COIN_LIST_MAX_PAGE_SIZE = 100

export const coinListPageSchema = z.int().min(1)
export const coinListPageSizeSchema = z
  .int()
  .min(1)
  .max(COIN_LIST_MAX_PAGE_SIZE)
export const coinListPageQuerySchema = z.coerce.number().int().min(1)
export const coinListPageSizeQuerySchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(COIN_LIST_MAX_PAGE_SIZE)

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
    obverse: coinSurfaceWithEngraversResponseSchema,
    reverse: coinSurfaceWithEngraversResponseSchema,
    edge: coinSurfaceResponseSchema,
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

export const invalidEngraverSlugErrorSchema = errorResponseSchema(
  "invalid_engraver_slug",
  "Engraver Slug is invalid"
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
