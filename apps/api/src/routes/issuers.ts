import { issuerListResponseSchema as sharedIssuerListResponseSchema } from "@coin-archive/api"
import { createRoute } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { IssuerListResponse } from "@coin-archive/api"
import type { IssuerRecord } from "@coin-archive/db"


interface IssuerRouteOptions {
  listIssuers?: () => Promise<Array<IssuerRecord>>
}

const issuerListResponseSchema =
  sharedIssuerListResponseSchema.openapi("IssuerListResponse")

const issuerListRoute = createRoute({
  method: "get",
  path: "/v1/issuers",
  responses: {
    200: {
      content: { "application/json": { schema: issuerListResponseSchema } },
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

export function registerIssuerRoutes(app: ApiApp, options: IssuerRouteOptions) {
  app.openapi(issuerListRoute, async (context) => {
    const issuers = await (options.listIssuers ?? (async () => []))()
    const response = {
      issuers: issuers.map(({ name, code }) => ({ name, code })),
    } satisfies IssuerListResponse

    return context.json(response, 200)
  })
}
