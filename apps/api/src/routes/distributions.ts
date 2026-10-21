import {
  distributionListItemResponseSchema,
  distributionListResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { DistributionListResponse } from "@coin-archive/api"
import type { DistributionRecord } from "@coin-archive/db"

interface DistributionRouteOptions {
  listDistributions?: () => Promise<Array<DistributionRecord>>
}

const responseSchema = distributionListResponseSchema
  .safeExtend({
    distributions: z.array(
      distributionListItemResponseSchema.openapi("Distribution")
    ),
  })
  .openapi("DistributionListResponse")

const route = createRoute({
  method: "get",
  path: "/v1/distributions",
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema } },
      description: "Every Coin Distribution ordered by name then slug",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Coin Distributions",
      headers: responseHeaders,
    },
  },
})

export function registerDistributionRoutes(
  app: ApiApp,
  options: DistributionRouteOptions
) {
  app.openapi(route, async (context) => {
    const distributions = await (
      options.listDistributions ?? (async () => [])
    )()
    const response = {
      distributions: distributions.map(({ slug, name }) => ({ slug, name })),
    } satisfies DistributionListResponse
    return context.json(response, 200)
  })
}
