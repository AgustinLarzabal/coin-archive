import { randomUUID } from "node:crypto"

import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"

import { registerCoinDetailRoute } from "./routes/coins-detail.js"
import { registerCoinListRoute } from "./routes/coins-list.js"
import { registerCurrencyRoutes } from "./routes/currencies.js"
import { registerDistributionRoutes } from "./routes/distributions.js"
import { registerEngraverRoutes } from "./routes/engravers.js"
import { registerIssuerRoutes } from "./routes/issuers.js"
import { registerMintRoutes } from "./routes/mints.js"
import { registerOperationalRoutes } from "./routes/operational.js"
import { registerRulingAuthorityRoutes } from "./routes/rulers.js"
import type { AppEnvironment } from "./routes/shared.js"
import type {
  Coin,
  CoinListOptions,
  CoinListPage,
  CurrencyRecord,
  DistributionRecord,
  EngraverRecord,
  IssuerRecord,
  MintRecord,
  RulingAuthorityRecord,
} from "@coin-archive/db"

export interface AppOptions {
  allowedOrigins: ReadonlyArray<string>
  checkReadiness: () => Promise<void>
  findCoinById?: (coinId: string) => Promise<Coin | null>
  imageBaseUrl?: string
  listCoins?: (options?: CoinListOptions) => Promise<CoinListPage>
  listCurrencies?: () => Promise<Array<CurrencyRecord>>
  listDistributions?: () => Promise<Array<DistributionRecord>>
  listEngravers?: () => Promise<Array<EngraverRecord>>
  listIssuers?: () => Promise<Array<IssuerRecord>>
  listMints?: () => Promise<Array<MintRecord & { country: IssuerRecord }>>
  listRulingAuthorities?: () => Promise<Array<RulingAuthorityRecord>>
  log?: (line: string) => void
}

const validRequestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/
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
    context.header("Cache-Control", "no-store")
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
  registerCoinListRoute(app, {
    imageBaseUrl: options.imageBaseUrl,
    listCoins: options.listCoins,
  })
  registerCoinDetailRoute(app, {
    findCoinById: options.findCoinById,
    imageBaseUrl: options.imageBaseUrl,
  })
  registerCurrencyRoutes(app, { listCurrencies: options.listCurrencies })
  registerDistributionRoutes(app, {
    listDistributions: options.listDistributions,
  })
  registerIssuerRoutes(app, { listIssuers: options.listIssuers })
  registerMintRoutes(app, { listMints: options.listMints })
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
    return context.json(
      { error: { code: "not_found", message: "Not found" } },
      404
    )
  })

  app.onError((_error, context) => {
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
