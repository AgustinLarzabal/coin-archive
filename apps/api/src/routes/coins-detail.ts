import {
  coinIdSchema,
  coinNotFoundErrorSchema as sharedCoinNotFoundErrorSchema,
  invalidCoinIdErrorSchema as sharedInvalidCoinIdErrorSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { coinSchema, toCoinDetailResponse } from "./coin-response.js"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { CoinDetailResponse } from "@coin-archive/api"
import type { Coin } from "@coin-archive/db"

interface CoinDetailRouteOptions {
  findCoinById?: (coinId: string) => Promise<Coin | null>
  imageBaseUrl?: string
}

const coinPathParametersSchema = z
  .object({
    coinId: coinIdSchema.openapi({
      param: { name: "coinId", in: "path" },
    }),
  })
  .openapi("CoinPathParameters")

const invalidCoinIdErrorSchema =
  sharedInvalidCoinIdErrorSchema.openapi("InvalidCoinIdError")
const coinNotFoundErrorSchema =
  sharedCoinNotFoundErrorSchema.openapi("CoinNotFoundError")

const coinDetailRoute = createRoute({
  method: "get",
  path: "/v1/coins/{coinId}",
  request: { params: coinPathParametersSchema },
  responses: {
    200: {
      content: { "application/json": { schema: coinSchema } },
      description: "The requested Coin",
      headers: responseHeaders,
    },
    400: {
      content: { "application/json": { schema: invalidCoinIdErrorSchema } },
      description: "The Coin identifier is malformed",
      headers: responseHeaders,
    },
    404: {
      content: { "application/json": { schema: coinNotFoundErrorSchema } },
      description: "The Coin does not exist",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "The Coin lookup failed unexpectedly",
      headers: responseHeaders,
    },
  },
})

export function registerCoinDetailRoute(
  app: ApiApp,
  options: CoinDetailRouteOptions
) {
  app.openAPIRegistry.register("CoinPathParameters", coinPathParametersSchema)

  app.openapi(
    coinDetailRoute,
    async (context) => {
      const { coinId } = context.req.valid("param")
      const coin = await (options.findCoinById ?? (async () => null))(coinId)

      if (!coin) {
        return context.json(
          {
            error: {
              code: "coin_not_found" as const,
              message: "Coin not found" as const,
            },
          },
          404
        )
      }

      const response = toCoinDetailResponse(
        coin,
        options.imageBaseUrl
      ) satisfies CoinDetailResponse

      return context.json(response, 200)
    },
    (result, context) => {
      if (!result.success) {
        return context.json(
          {
            error: {
              code: "invalid_coin_id" as const,
              message: "Coin ID must be a valid UUID" as const,
            },
          },
          400
        )
      }
    }
  )
}
