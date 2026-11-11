import {
  rulingAuthorityListResponseSchema,
  rulingAuthorityResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { RulingAuthorityListResponse } from "@coin-archive/api"
import type { RulingAuthorityRecord } from "@coin-archive/db"

const rulingAuthorityListRoute = createRoute({
  method: "get",
  path: "/v1/rulers",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: rulingAuthorityListResponseSchema
            .safeExtend({
              rulers: z.array(
                rulingAuthorityResponseSchema.openapi("RulingAuthority")
              ),
            })
            .openapi("RulingAuthorityListResponse"),
        },
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
  listRulingAuthorities?: () => Promise<Array<RulingAuthorityRecord>>
) {
  app.openapi(rulingAuthorityListRoute, async (context) => {
    const rulers = await (listRulingAuthorities ?? (async () => []))()
    const response = {
      rulers: rulers.map(({ slug, name, role, tenure }) => ({
        slug,
        name,
        role,
        tenure,
      })),
    } satisfies RulingAuthorityListResponse
    return context.json(response, 200)
  })
}
