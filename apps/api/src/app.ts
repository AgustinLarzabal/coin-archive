import { randomUUID } from "node:crypto"

import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"

import { registerCoinRoutes } from "./routes/coins.js"
import { registerEngraverRoutes } from "./routes/engravers.js"
import { registerIssuerRoutes } from "./routes/issuers.js"
import { registerOperationalRoutes } from "./routes/operational.js"
import { registerRulingAuthorityRoutes } from "./routes/rulers.js"
import type { AppEnvironment } from "./routes/shared.js"
import type {
  Coin,
  CoinListOptions,
  CoinListPage,
  EngraverRecord,
  IssuerRecord,
  RulingAuthorityRecord,
} from "@workspace/db"

export interface AppOptions {
  allowedOrigins: ReadonlyArray<string>
  checkReadiness: () => Promise<void>
  findCoinById?: (coinId: string) => Promise<Coin | null>
  imageBaseUrl?: string
  listCoins?: (options?: CoinListOptions) => Promise<CoinListPage>
  listEngravers?: () => Promise<Array<EngraverRecord>>
  listIssuers?: () => Promise<Array<IssuerRecord>>
  listRulingAuthorities?: () => Promise<Array<RulingAuthorityRecord>>
  log?: (line: string) => void
}

const validRequestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/
const noStorePaths = new Set([
  "/health",
  "/openapi.json",
  "/ready",
  "/v1/coins",
  "/v1/engravers",
  "/v1/issuers",
  "/v1/rulers",
])

export function createApp(options: AppOptions) {
  const app = new OpenAPIHono<AppEnvironment>()
  const log = options.log ?? console.log

  app.use("*", async (context, next) => {
    const startedAt = performance.now()
    const incomingRequestId = context.req.header("x-request-id")
    const requestId =
      incomingRequestId && validRequestIdPattern.test(incomingRequestId)
        ? incomingRequestId
        : randomUUID()

    context.set("requestId", requestId)
    await next()
    context.header("x-request-id", requestId)
    log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        requestId,
        method: context.req.method,
        path: context.req.path,
        status: context.res.status,
        durationMs: Number((performance.now() - startedAt).toFixed(3)),
      })
    )
  })

  app.use("*", async (context, next) => {
    await next()
    if (
      noStorePaths.has(context.req.path) ||
      context.req.path.startsWith("/v1/coins/")
    ) {
      context.header("Cache-Control", "no-store")
    }
  })

  app.use(
    "*",
    cors({
      credentials: false,
      origin: (origin) =>
        options.allowedOrigins.includes(origin) ? origin : undefined,
    })
  )

  registerOperationalRoutes(app, {
    checkReadiness: options.checkReadiness,
    log,
  })
  registerCoinRoutes(app, {
    findCoinById: options.findCoinById,
    imageBaseUrl: options.imageBaseUrl,
    listCoins: options.listCoins,
  })
  registerIssuerRoutes(app, { listIssuers: options.listIssuers })
  registerEngraverRoutes(app, { listEngravers: options.listEngravers })
  registerRulingAuthorityRoutes(app, {
    listRulingAuthorities: options.listRulingAuthorities,
  })

  app.doc("/openapi.json", {
    info: {
      title: "Coin Archive API",
      version: "1.0.0",
    },
    openapi: "3.1.0",
  })

  app.notFound((context) => {
    context.header("Cache-Control", "no-store")
    return context.json(
      { error: { code: "not_found", message: "Not found" } },
      404
    )
  })

  app.onError((_error, context) => {
    context.header("Cache-Control", "no-store")
    log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        event: "request_failed",
        requestId: context.get("requestId"),
      })
    )
    return context.json(
      {
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      },
      500
    )
  })

  return app
}
