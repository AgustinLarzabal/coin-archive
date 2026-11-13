import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { createFindCoin } from "./queries/coin-detail.js"
import { createListCoins } from "./queries/coin-list.js"
import { createReferenceDataQueries } from "./queries/index.js"
import * as schema from "./schema/index.js"
import type { Coin } from "./queries/coin-detail-types.js"
import type {
  CoinListOptions,
  CoinListPage,
} from "./queries/coin-list-types.js"

export interface Database {
  checkReadiness: () => Promise<void>
  close: () => Promise<void>
  findCoinById: (coinId: string) => Promise<Coin | null>
  findCoinBySlug: (coinSlug: string) => Promise<Coin | null>
  listCoins: (options?: CoinListOptions) => Promise<CoinListPage>
  listShapes: () => Promise<Array<schema.CoinShapeRecord>>
  listOrientations: () => Promise<Array<schema.CoinOrientationRecord>>
  listTechniques: () => Promise<Array<schema.CoinTechniqueRecord>>
  listCompositions: () => Promise<Array<schema.CompositionRecord>>
  listCurrencies: () => Promise<Array<schema.CurrencyRecord>>
  listDistributions: () => Promise<Array<schema.DistributionRecord>>
  listTags: () => Promise<Array<schema.TagRecord>>
  listEngravers: () => Promise<Array<schema.EngraverRecord>>
  listIssuers: () => Promise<Array<schema.IssuerRecord>>
  listMints: () => Promise<
    Array<schema.MintRecord & { country: schema.IssuerRecord }>
  >
  listRulingAuthorities: () => Promise<Array<schema.RulingAuthorityRecord>>
  orm: ReturnType<typeof drizzle<typeof schema>>
  schema: typeof schema
}

export interface DatabaseOptions {
  connectionTimeoutMillis?: number
  onPoolError?: (error: Error) => void
  onQuery?: (query: string, params: Array<unknown>) => void
  statementTimeoutMillis?: number
}

export function createDatabase(
  databaseUrl: string,
  options: DatabaseOptions = {}
): Database {
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 5_000,
    statement_timeout: options.statementTimeoutMillis ?? 10_000,
  })
  pool.on("error", options.onPoolError ?? ((error) => console.error(error)))
  const orm = drizzle({
    client: pool,
    ...(options.onQuery
      ? { logger: { logQuery: options.onQuery } }
      : { logger: false }),
    schema,
  })
  return {
    async checkReadiness() {
      await orm.execute(sql`select 1`)
    },
    close: () => pool.end(),
    findCoinById: createFindCoin(orm, "id"),
    findCoinBySlug: createFindCoin(orm, "slug"),
    listCoins: createListCoins(orm),
    ...createReferenceDataQueries(orm),
    orm,
    schema,
  }
}
