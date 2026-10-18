import { createRoute, z } from "@hono/zod-openapi"
import {
  currencyListResponseSchema as sharedCurrencyListResponseSchema,
  currencyResponseSchema,
} from "@workspace/api"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { CurrencyListResponse } from "@workspace/api"
import type { CurrencyRecord } from "@workspace/db"

interface CurrencyRouteOptions {
  listCurrencies?: () => Promise<Array<CurrencyRecord>>
}

const currencyListResponseSchema = sharedCurrencyListResponseSchema
  .safeExtend({ currencies: z.array(currencyResponseSchema.openapi("Currency")) })
  .openapi("CurrencyListResponse")

const currencyListRoute = createRoute({
  method: "get",
  path: "/v1/currencies",
  responses: {
    200: {
      content: { "application/json": { schema: currencyListResponseSchema } },
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
  options: CurrencyRouteOptions
) {
  app.openapi(currencyListRoute, async (context) => {
    const currencies = await (options.listCurrencies ?? (async () => []))()
    const response = {
      currencies: currencies.map(({ slug, name, periodLabel }) => ({
        slug,
        name,
        fullName: `${name} (${periodLabel})`,
      })),
    } satisfies CurrencyListResponse

    return context.json(response, 200)
  })
}
