import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"

export const currencyResponseSchema = z.strictObject({
  slug: slugSchema,
  name: displayTextSchema(200),
  fullName: displayTextSchema(403),
})

export type CurrencyResponse = z.infer<typeof currencyResponseSchema>

export const currencyListResponseSchema = z.strictObject({
  currencies: z.array(currencyResponseSchema),
})

export type CurrencyListResponse = z.infer<typeof currencyListResponseSchema>

export const invalidCurrencySlugErrorSchema = errorResponseSchema(
  "invalid_currency_slug",
  "Currency Slug is invalid"
)
