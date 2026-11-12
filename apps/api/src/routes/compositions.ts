import {
  compositionListResponseSchema,
  compositionResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { CompositionListResponse } from "@coin-archive/api"
import type { CompositionRecord } from "@coin-archive/db"

const responseSchema = compositionListResponseSchema
  .safeExtend({
    compositions: z.array(compositionResponseSchema.openapi("Composition")),
  })
  .openapi("CompositionListResponse")

const compositionListRoute = createRoute({
  method: "get",
  path: "/v1/compositions",
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema } },
      description: "Every Coin Composition ordered by name then slug",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Coin Compositions",
      headers: responseHeaders,
    },
  },
})

export function registerCompositionRoutes(
  app: ApiApp,
  listCompositions?: () => Promise<Array<CompositionRecord>>
) {
  app.openapi(compositionListRoute, async (context) => {
    const compositions = listCompositions ? await listCompositions() : []
    const response = {
      compositions: compositions.map(({ slug, name }) => ({ slug, name })),
    } satisfies CompositionListResponse

    return context.json(response, 200)
  })
}
