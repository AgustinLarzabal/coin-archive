import {
  orientationListResponseSchema,
  orientationResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { OrientationListResponse } from "@coin-archive/api"
import type { CoinOrientationRecord } from "@coin-archive/db"

const responseSchema = orientationListResponseSchema
  .safeExtend({
    orientations: z.array(orientationResponseSchema.openapi("Orientation")),
  })
  .openapi("OrientationListResponse")

const orientationListRoute = createRoute({
  method: "get",
  path: "/v1/orientations",
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema } },
      description: "Every Coin Orientation ordered by name then slug",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Coin Orientations",
      headers: responseHeaders,
    },
  },
})

export function registerOrientationRoutes(
  app: ApiApp,
  listOrientations?: () => Promise<Array<CoinOrientationRecord>>
) {
  app.openapi(orientationListRoute, async (context) => {
    const orientations = listOrientations ? await listOrientations() : []
    const response = {
      orientations: orientations.map(({ slug, name }) => ({ slug, name })),
    } satisfies OrientationListResponse

    return context.json(response, 200)
  })
}
