import { createRoute } from "@hono/zod-openapi"
import { rulingAuthorityListResponseSchema as sharedRulingAuthorityListResponseSchema } from "@workspace/api"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { RulingAuthorityListResponse } from "@workspace/api"
import type { RulingAuthorityRecord } from "@workspace/db"

const rulingAuthorityListResponseSchema =
  sharedRulingAuthorityListResponseSchema.openapi("RulingAuthorityListResponse")

const rulingAuthorityListRoute = createRoute({
  method: "get",
  path: "/v1/rulers",
  responses: {
    200: {
      content: {
        "application/json": { schema: rulingAuthorityListResponseSchema },
      },
      description: "Every Ruling Authority, sorted by name and Slug",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Ruling Authorities",
      headers: responseHeaders,
    },
  },
})

export function registerRulingAuthorityRoutes(
  app: ApiApp,
  options: {
    listRulingAuthorities?: () => Promise<Array<RulingAuthorityRecord>>
  }
) {
  app.openapi(rulingAuthorityListRoute, async (context) => {
    const rulers = await (options.listRulingAuthorities ?? (async () => []))()
    const response = {
      rulers: rulers.map(({ slug, name }) => ({ slug, name })),
    } satisfies RulingAuthorityListResponse
    return context.json(response, 200)
  })
}
