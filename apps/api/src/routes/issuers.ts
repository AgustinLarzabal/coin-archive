import {
  issuerListResponseSchema,
  issuerResponseSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { IssuerListResponse } from "@coin-archive/api"
import type { IssuerRecord } from "@coin-archive/db"

const responseSchema = issuerListResponseSchema
  .safeExtend({ issuers: z.array(issuerResponseSchema.openapi("Issuer")) })
  .openapi("IssuerListResponse")

const issuerListRoute = createRoute({
  method: "get",
  path: "/v1/issuers",
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema } },
      description: "A list of Issuers",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Issuers",
      headers: responseHeaders,
    },
  },
})

export function registerIssuerRoutes(
  app: ApiApp,
  listIssuers?: () => Promise<Array<IssuerRecord>>
) {
  app.openapi(issuerListRoute, async (context) => {
    const issuers = listIssuers ? await listIssuers() : []
    const response = {
      issuers: issuers.map(({ name, code, slug }) => ({
        name,
        code,
        slug,
      })),
    } satisfies IssuerListResponse

    return context.json(response, 200)
  })
}
