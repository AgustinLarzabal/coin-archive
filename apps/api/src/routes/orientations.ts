import {
  coinOrientationListResponseSchema,
  namedSlugResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { CoinOrientationListResponse } from "@coin-archive/api"
import type { CoinOrientationRecord } from "@coin-archive/db"

const route = createRoute({
  method: "get",
  path: "/v1/orientations",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: coinOrientationListResponseSchema
            .safeExtend({
              orientations: z.array(
                namedSlugResponseSchema.openapi("Orientation")
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
      } satisfies CoinOrientationListResponse,
      200
    )
  })
}
