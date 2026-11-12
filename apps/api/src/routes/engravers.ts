import {
  engraverListResponseSchema,
  engraverResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { EngraverListResponse } from "@coin-archive/api"
import type { EngraverRecord } from "@coin-archive/db"

const responseSchema = engraverListResponseSchema
  .safeExtend({
    engravers: z.array(engraverResponseSchema.openapi("Engraver")),
  })
  .openapi("EngraverListResponse")

const engraverListRoute = createRoute({
  method: "get",
  path: "/v1/engravers",
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema } },
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
    const engravers = listEngravers ? await listEngravers() : []
    const response = {
      engravers: engravers.map(({ slug, fullName }) => ({ slug, fullName })),
    } satisfies EngraverListResponse

    return context.json(response, 200)
  })
}
