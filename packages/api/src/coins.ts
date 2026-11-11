import { z } from "zod"

import {
  displayTextSchema,
  errorResponseSchema,
  historicalYearSchema,
} from "./common.js"
import { currencyResponseSchema } from "./currencies.js"

export function hasOrderedIssuePeriod(coin: {
  firstIssueYear: number
  lastIssueYear: number
}) {
  return coin.firstIssueYear <= coin.lastIssueYear
}

export const coinIdSchema = z.uuid()

export const coinFaceValueResponseSchema = z.strictObject({
  label: displayTextSchema(200),
  numericValue: z.number().positive().meta({
    description:
      "Positive JSON numeric value derived from a fixed-precision decimal with up to 18 integer and 12 fractional digits; repeating historical values are curated fixed-precision approximations.",
  }),
  currency: currencyResponseSchema,
})

export const firstIssueYearSchema = historicalYearSchema.meta({
  description:
    "Signed conventional Issue Year: negative values are BCE, positive values are CE, and zero is invalid. Must be less than or equal to lastIssueYear.",
  not: { const: 0 },
})

export const lastIssueYearSchema = historicalYearSchema.meta({
  description:
    "Signed conventional Issue Year: negative values are BCE, positive values are CE, and zero is invalid. Must be greater than or equal to firstIssueYear.",
  not: { const: 0 },
})

export type CoinFaceValueResponse = z.infer<typeof coinFaceValueResponseSchema>

export const invalidCoinIdErrorSchema = errorResponseSchema(
  "invalid_coin_id",
  "Coin ID must be a valid UUID"
)
export const coinNotFoundErrorSchema = errorResponseSchema(
  "coin_not_found",
  "Coin not found"
)
