import {
  distributionListResponseSchema,
  distributionResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { DistributionListResponse } from "@coin-archive/api"
import type { DistributionRecord } from "@coin-archive/db"

const responseSchema = distributionListResponseSchema
  .safeExtend({
    distributions: z.array(distributionResponseSchema.openapi("Distribution")),
  })
  .openapi("DistributionListResponse")

const distributionListRoute = createRoute({
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
  listDistributions?: () => Promise<Array<DistributionRecord>>
) {
  app.openapi(distributionListRoute, async (context) => {
    const distributions = listDistributions ? await listDistributions() : []
    const response = {
      distributions: distributions.map(({ slug, name }) => ({ slug, name })),
    } satisfies DistributionListResponse

    return context.json(response, 200)
  })
}
