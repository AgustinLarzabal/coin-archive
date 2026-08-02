import {
  createDatabase,
  getOrientationMaintenanceRecordWithDatabase,
  getOrientationMaintenanceRecordsWithDatabase,
  getPublicCoinWithDatabase,
  getCoinsWithDatabase,
} from "@coin-archive/db"
import { createAuth, parseTrustedOrigins } from "@coin-archive/auth/server"
import { WorkerEntrypoint } from "cloudflare:workers"
import { createApiApp } from "./app"

export default {
  async fetch(request: Request, env: Env) {
    return handleRequest(request, env, false)
  },
}

export class AuthProxy extends WorkerEntrypoint<Env> {
  override fetch(request: Request) {
    return handleRequest(request, this.env, true)
  }
}

async function handleRequest(
  request: Request,
  env: Env,
  trustProxyHeaders: boolean
) {
  const database = createDatabase(env.DATABASE_URL)
  const auth = createAuth({
    database: database.db,
    environment: {
      betterAuthSecret: env.BETTER_AUTH_SECRET,
      betterAuthUrl: env.BETTER_AUTH_URL,
      trustedOrigins: parseTrustedOrigins(env.BETTER_AUTH_TRUSTED_ORIGINS),
      googleClientId: env.GOOGLE_CLIENT_ID,
      googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  })
  const app = createApiApp({
    trustProxyHeaders,
    environment: env.API_ENVIRONMENT,
    surfaceImageOrigin: env.SURFACE_IMAGE_ORIGIN,
    rateLimit: async (clientIp) =>
      (
        await env.API_RATE_LIMITER.limit({
          key: `${env.API_ENVIRONMENT}:${clientIp}`,
        })
      ).success,
    maintenanceRateLimit: async (collectorId) =>
      (
        await env.API_RATE_LIMITER.limit({
          key: `${env.API_ENVIRONMENT}:collector:${collectorId}:maintenance-read`,
        })
      ).success,
    browseCoins: async (input) =>
      (
        await getCoinsWithDatabase(database.db, {
          distributionCode: input.distribution,
          engraverCode: input.engraver,
          issuerCode: input.issuer,
          rulerCode: input.ruler,
          themeCode: input.theme,
          titleSearch: input.q,
          cursor: input.cursor,
          limit: (input.limit ?? 30) + 1,
        })
      ).filter(
        (coin): coin is typeof coin & { createdAt: Date } =>
          coin.createdAt !== undefined
      ),
    getCoin: (coinId) => getPublicCoinWithDatabase(database.db, coinId),
    getCollector: async (collectorRequest) => {
      const resolved = await auth.api.getSession({
        headers: collectorRequest.headers,
      })
      if (resolved === null) return null
      const role = resolved.user.role
      if (role !== "collector" && role !== "editor" && role !== "admin") {
        return null
      }
      return { id: resolved.user.id, role }
    },
    listOrientations: (input) =>
      getOrientationMaintenanceRecordsWithDatabase(database.db, input),
    getOrientation: (orientationId) =>
      getOrientationMaintenanceRecordWithDatabase(database.db, orientationId),
    handleAuthRequest: (authRequest) => auth.handler(authRequest),
  })
  try {
    return await app.fetch(request)
  } finally {
    await database.client.end()
  }
}
