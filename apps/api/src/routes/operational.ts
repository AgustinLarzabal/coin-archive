import {
  operationalOkResponseSchema as sharedOperationalOkResponseSchema,
  operationalUnavailableResponseSchema as sharedOperationalUnavailableResponseSchema,
} from "@coin-archive/api"
import { createRoute } from "@hono/zod-openapi"

import { responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"

interface OperationalRouteOptions {
  checkReadiness: () => Promise<void>
  log: (line: string) => void
}

const healthResponseSchema =
  sharedOperationalOkResponseSchema.openapi("HealthResponse")
const unavailableResponseSchema =
  sharedOperationalUnavailableResponseSchema.openapi("UnavailableResponse")

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  responses: {
    200: {
      content: { "application/json": { schema: healthResponseSchema } },
      description: "The API process is serving HTTP",
      headers: responseHeaders,
    },
  },
})

const readyRoute = createRoute({
  method: "get",
  path: "/ready",
  responses: {
    200: {
      content: { "application/json": { schema: healthResponseSchema } },
      description: "The API can perform database-backed work",
      headers: responseHeaders,
    },
    503: {
      content: { "application/json": { schema: unavailableResponseSchema } },
      description: "The API cannot currently perform database-backed work",
      headers: responseHeaders,
    },
  },
})

export function registerOperationalRoutes(
  app: ApiApp,
  options: OperationalRouteOptions
) {
  app.openapi(healthRoute, (context) => context.json({ status: "ok" }, 200))
  app.openapi(readyRoute, async (context) => {
    try {
      await options.checkReadiness()
      return context.json({ status: "ok" }, 200)
    } catch {
      options.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          event: "readiness_check_failed",
          requestId: context.get("requestId"),
        })
      )
      return context.json({ status: "unavailable" }, 503)
    }
  })
}
