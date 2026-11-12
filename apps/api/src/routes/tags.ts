import { tagListResponseSchema, tagResponseSchema } from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { TagListResponse } from "@coin-archive/api"
import type { TagRecord } from "@coin-archive/db"

const responseSchema = tagListResponseSchema
  .safeExtend({
    tags: z.array(tagResponseSchema.openapi("Tag")),
  })
  .openapi("TagListResponse")

const tagListRoute = createRoute({
  method: "get",
  path: "/v1/tags",
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema } },
      description: "Every Tag ordered by name then slug",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Tags",
      headers: responseHeaders,
    },
  },
})

export function registerTagRoutes(
  app: ApiApp,
  listTags?: () => Promise<Array<TagRecord>>
) {
  app.openapi(tagListRoute, async (context) => {
    const tags = listTags ? await listTags() : []
    const response = {
      tags: tags.map(({ slug, name }) => ({ slug, name })),
    } satisfies TagListResponse

    return context.json(response, 200)
  })
}
