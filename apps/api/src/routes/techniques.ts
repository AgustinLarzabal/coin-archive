import {
  techniqueListResponseSchema,
  techniqueResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { TechniqueListResponse } from "@coin-archive/api"
import type { CoinTechniqueRecord } from "@coin-archive/db"

const responseSchema = techniqueListResponseSchema
  .safeExtend({
    techniques: z.array(techniqueResponseSchema.openapi("Technique")),
  })
  .openapi("TechniqueListResponse")

const techniqueListRoute = createRoute({
  method: "get",
  path: "/v1/techniques",
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema } },
      description: "Every Coin Technique ordered by name then slug",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Coin Techniques",
      headers: responseHeaders,
    },
  },
})

export function registerTechniqueRoutes(
  app: ApiApp,
  listTechniques?: () => Promise<Array<CoinTechniqueRecord>>
) {
  app.openapi(techniqueListRoute, async (context) => {
    const techniques = listTechniques ? await listTechniques() : []
    const response = {
      techniques: techniques.map(({ slug, name }) => ({ slug, name })),
    } satisfies TechniqueListResponse

    return context.json(response, 200)
  })
}
