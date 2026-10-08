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

export const issuerResponseSchema = z.strictObject({
  name: z.string().min(1).max(200),
  code: issuerCodeSchema,
})

export type IssuerResponse = z.infer<typeof issuerResponseSchema>

export const issuerListResponseSchema = z.strictObject({
  issuers: z.array(issuerResponseSchema),
})

export type IssuerListResponse = z.infer<typeof issuerListResponseSchema>

const coinResponseShape = {
  id: coinIdSchema,
  title: z.string().min(1).max(200),
  issuer: issuerResponseSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}

export const coinListItemResponseSchema = z.strictObject({
  ...coinResponseShape,
  obverseImageUrl: z.url().nullable(),
  reverseImageUrl: z.url().nullable(),
})

export type CoinListItemResponse = z.infer<typeof coinListItemResponseSchema>

export const coinSurfaceResponseSchema = z.strictObject({
  description: z.string().min(1).max(10_000).nullable(),
  imageUrl: z.url().nullable(),
  createdAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime().nullable(),
})

export type CoinSurfaceResponse = z.infer<typeof coinSurfaceResponseSchema>

export const coinDetailResponseSchema = z.strictObject({
  ...coinResponseShape,
  obverse: coinSurfaceResponseSchema,
  reverse: coinSurfaceResponseSchema,
  edge: coinSurfaceResponseSchema,
})

export type CoinDetailResponse = z.infer<typeof coinDetailResponseSchema>

export const coinListResponseSchema = z.strictObject({
  coins: z.array(coinListItemResponseSchema),
})

export type CoinListResponse = z.infer<typeof coinListResponseSchema>

// Remove after the version-one Coin Surface rollout is complete.
const compatibleCoinListItemResponseSchema = coinListItemResponseSchema
  .partial({ obverseImageUrl: true, reverseImageUrl: true })
  .strip()
  .transform((coin) => ({
    ...coin,
    obverseImageUrl: coin.obverseImageUrl ?? null,
    reverseImageUrl: coin.reverseImageUrl ?? null,
  }))

export const compatibleCoinListResponseSchema = z.object({
  coins: z.array(compatibleCoinListItemResponseSchema),
})

// Remove after the version-one Coin Surface rollout is complete.
export const missingCoinSurfaceResponse: Readonly<CoinSurfaceResponse> =
  Object.freeze({
    description: null,
    imageUrl: null,
    createdAt: null,
    updatedAt: null,
  })

export const compatibleCoinDetailResponseSchema = coinDetailResponseSchema
  .partial({ obverse: true, reverse: true, edge: true })
  .strip()
  .transform((coin) => ({
    ...coin,
    obverse: coin.obverse ?? { ...missingCoinSurfaceResponse },
    reverse: coin.reverse ?? { ...missingCoinSurfaceResponse },
    edge: coin.edge ?? { ...missingCoinSurfaceResponse },
  }))

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

export const coinNotFoundErrorSchema = errorResponseSchema(
  "coin_not_found",
  "Coin not found"
)

export const internalErrorSchema = errorResponseSchema(
  "internal_error",
  "Internal server error"
)
