import {
  createDatabase,
  getPublicCoinWithDatabase,
  getCoinsWithDatabase,
} from "@coin-archive/db"
import { createPublicApiApp } from "./app"

export interface Env {
  API_ENVIRONMENT: "staging" | "production"
  DATABASE_URL: string
  SURFACE_IMAGE_ORIGIN: string
  API_RATE_LIMITER: RateLimit
}

export default {
  async fetch(request: Request, env: Env) {
    const database = createDatabase(env.DATABASE_URL)
    const app = createPublicApiApp({
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
    })
    try {
      return await app.fetch(request)
    } finally {
      await database.client.end()
    }
  },
}
