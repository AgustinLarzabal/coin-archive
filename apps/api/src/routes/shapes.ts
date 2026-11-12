import { shapeListResponseSchema, shapeResponseSchema } from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { ShapeListResponse } from "@coin-archive/api"
import type { CoinShapeRecord } from "@coin-archive/db"

const responseSchema = shapeListResponseSchema
  .safeExtend({
    shapes: z.array(shapeResponseSchema.openapi("Shape")),
  })
  .openapi("ShapeListResponse")

const shapeListRoute = createRoute({
  method: "get",
  path: "/v1/shapes",
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema } },
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
  listShapes?: () => Promise<Array<CoinShapeRecord>>
) {
  app.openapi(shapeListRoute, async (context) => {
    const shapes = listShapes ? await listShapes() : []
    const response = {
      shapes: shapes.map(({ slug, name }) => ({ slug, name })),
    } satisfies ShapeListResponse

    return context.json(response, 200)
  })
}
