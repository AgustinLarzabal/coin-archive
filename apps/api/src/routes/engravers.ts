import { engraverListResponseSchema as sharedEngraverListResponseSchema } from "@coin-archive/api"
import { createRoute } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { EngraverListResponse } from "@coin-archive/api"
import type { EngraverRecord } from "@coin-archive/db"

const engraverListResponseSchema = sharedEngraverListResponseSchema.openapi(
  "EngraverListResponse"
)

const engraverListRoute = createRoute({
  method: "get",
  path: "/v1/engravers",
  responses: {
    200: {
      content: { "application/json": { schema: engraverListResponseSchema } },
      description: "A list of Engravers",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Engravers",
      headers: responseHeaders,
    },
  },
})

export function registerEngraverRoutes(
  app: ApiApp,
  listEngravers?: () => Promise<Array<EngraverRecord>>
) {
  app.openapi(engraverListRoute, async (context) => {
    const engravers = await (listEngravers ?? (async () => []))()
    const response = {
      engravers: engravers.map(({ slug, fullName }) => ({ slug, fullName })),
    } satisfies EngraverListResponse

    return context.json(response, 200)
  })
}
