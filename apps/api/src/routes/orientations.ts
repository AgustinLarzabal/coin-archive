import {
  orientationListResponseSchema,
  orientationResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { OrientationListResponse } from "@coin-archive/api"
import type { CoinOrientationRecord } from "@coin-archive/db"

const route = createRoute({
  method: "get",
  path: "/v1/orientations",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: orientationListResponseSchema
            .safeExtend({
              orientations: z.array(
                orientationResponseSchema.openapi("Orientation")
              ),
            })
            .openapi("OrientationListResponse"),
        },
      },
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
  options: { listOrientations?: () => Promise<Array<CoinOrientationRecord>> }
) {
  app.openapi(route, async (context) => {
    const orientations = await (options.listOrientations ?? (async () => []))()
    return context.json(
      {
        orientations: orientations.map(({ slug, name }) => ({ slug, name })),
      } satisfies OrientationListResponse,
      200
    )
  })
}
