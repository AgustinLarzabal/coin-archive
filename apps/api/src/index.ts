import {
  createDatabase,
  getPublicCoinWithDatabase,
  getCoinsWithDatabase,
} from "@coin-archive/db"
import { createAuth, parseTrustedOrigins } from "@coin-archive/auth/server"
import { createApiApp } from "./app"

export default {
  async fetch(request: Request, env: Env) {
    const database = createDatabase(env.DATABASE_URL)
    const app = createApiApp({
      environment: env.API_ENVIRONMENT,
      surfaceImageOrigin: env.SURFACE_IMAGE_ORIGIN,
      rateLimit: async (clientIp) =>
        (
          await env.API_RATE_LIMITER.limit({
            key: `${env.API_ENVIRONMENT}:${clientIp}`,
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
      handleAuthRequest: (authRequest) =>
        createAuth({
          database: database.db,
          environment: {
            betterAuthSecret: env.BETTER_AUTH_SECRET,
            betterAuthUrl: env.BETTER_AUTH_URL,
            trustedOrigins: parseTrustedOrigins(
              env.BETTER_AUTH_TRUSTED_ORIGINS
            ),
            googleClientId: env.GOOGLE_CLIENT_ID,
            googleClientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }).handler(authRequest),
    })
    try {
      return await app.fetch(request)
    } finally {
      await database.client.end()
    }
  },
}
