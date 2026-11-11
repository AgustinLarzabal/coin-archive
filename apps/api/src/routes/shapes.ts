import { shapeListResponseSchema, shapeResponseSchema } from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { ShapeListResponse } from "@coin-archive/api"
import type { CoinShapeRecord } from "@coin-archive/db"

const route = createRoute({
  method: "get",
  path: "/v1/shapes",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: shapeListResponseSchema
            .safeExtend({
              shapes: z.array(shapeResponseSchema.openapi("Shape")),
            })
            .openapi("ShapeListResponse"),
        },
      },
      description: "Every Coin Shape ordered by name then slug",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Coin Shapes",
      headers: responseHeaders,
    },
  },
})

export function registerShapeRoutes(
  app: ApiApp,
  options: { listShapes?: () => Promise<Array<CoinShapeRecord>> }
) {
  app.openapi(route, async (context) => {
    const shapes = await (options.listShapes ?? (async () => []))()
    return context.json(
      {
        shapes: shapes.map(({ slug, name }) => ({ slug, name })),
      } satisfies ShapeListResponse,
      200
    )
  })
}
