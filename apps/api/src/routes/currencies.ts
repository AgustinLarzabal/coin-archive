import {
  currencyListResponseSchema,
  currencyResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { CurrencyListResponse, CurrencyResponse } from "@coin-archive/api"
import type { CurrencyRecord } from "@coin-archive/db"

export function toCurrencyResponse({
  slug,
  name,
  periodLabel,
}: CurrencyRecord): CurrencyResponse {
  return { slug, name, fullName: `${name} (${periodLabel})` }
}

const responseSchema = currencyListResponseSchema
  .safeExtend({
    currencies: z.array(currencyResponseSchema.openapi("Currency")),
  })
  .openapi("CurrencyListResponse")

const currencyListRoute = createRoute({
  method: "get",
  path: "/v1/currencies",
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema } },
      description: "Every canonical Currency ordered by derived Full Name",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Currencies",
      headers: responseHeaders,
    },
  },
})

export function registerCurrencyRoutes(
  app: ApiApp,
  listCurrencies?: () => Promise<Array<CurrencyRecord>>
) {
  app.openapi(currencyListRoute, async (context) => {
    const currencies = listCurrencies ? await listCurrencies() : []
    const response = {
      currencies: currencies.map(toCurrencyResponse),
    } satisfies CurrencyListResponse

    return context.json(response, 200)
  })
}
