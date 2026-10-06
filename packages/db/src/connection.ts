import { and, asc, desc, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { alias } from "drizzle-orm/pg-core"
import { Pool } from "pg"

import * as schema from "./schema/index.js"

export interface Database {
  checkReadiness: () => Promise<void>
  close: () => Promise<void>
  findCoinById: (coinId: string) => Promise<Coin | null>
  listCoins: (options?: CoinListOptions) => Promise<Array<CoinListItem>>
  listIssuers: () => Promise<Array<schema.IssuerRecord>>
  orm: ReturnType<typeof drizzle<typeof schema>>
  schema: typeof schema
}

export type Coin = schema.CoinRecord & {
  issuer: schema.IssuerRecord
  obverse: schema.CoinSurfaceRecord | null
  reverse: schema.CoinSurfaceRecord | null
}

export type CoinListItem = schema.CoinRecord & {
  issuer: schema.IssuerRecord
  obverseImageKey: string | null
  reverseImageKey: string | null
}

export interface CoinListOptions {
  issuerCode?: string
}

export interface DatabaseOptions {
  connectionTimeoutMillis?: number
  onPoolError?: (error: Error) => void
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
  const orm = drizzle({ client: pool, schema })
  const obverses = alias(schema.coinSurfaces, "obverses")
  const reverses = alias(schema.coinSurfaces, "reverses")

  return {
    async checkReadiness() {
      await orm.execute(sql`select 1`)
    },
    close: () => pool.end(),
    async findCoinById(coinId) {
      const rows = await orm
        .select({
          coin: schema.coins,
          issuer: schema.issuers,
          obverse: obverses,
          reverse: reverses,
        })
        .from(schema.coins)
        .innerJoin(schema.issuers, eq(schema.coins.issuerId, schema.issuers.id))
        .leftJoin(
          obverses,
          and(
            eq(obverses.coinId, schema.coins.id),
            eq(obverses.kind, "obverse")
          )
        )
        .leftJoin(
          reverses,
          and(
            eq(reverses.coinId, schema.coins.id),
            eq(reverses.kind, "reverse")
          )
        )
        .where(eq(schema.coins.id, coinId))
        .limit(1)
      const row = rows.at(0)
      return row
        ? {
            ...row.coin,
            issuer: row.issuer,
            obverse: row.obverse,
            reverse: row.reverse,
          }
        : null
    },
    async listCoins(filters = {}) {
      const rows = await orm
        .select({
          coin: schema.coins,
          issuer: schema.issuers,
          obverseImageKey: obverses.imageKey,
          reverseImageKey: reverses.imageKey,
        })
        .from(schema.coins)
        .innerJoin(schema.issuers, eq(schema.coins.issuerId, schema.issuers.id))
        .leftJoin(
          obverses,
          and(
            eq(obverses.coinId, schema.coins.id),
            eq(obverses.kind, "obverse")
          )
        )
        .leftJoin(
          reverses,
          and(
            eq(reverses.coinId, schema.coins.id),
            eq(reverses.kind, "reverse")
          )
        )
        .where(
          filters.issuerCode === undefined
            ? undefined
            : eq(schema.issuers.code, filters.issuerCode)
        )
        .orderBy(desc(schema.coins.createdAt), asc(schema.coins.id))
      return rows.map(({ coin, issuer, obverseImageKey, reverseImageKey }) => ({
        ...coin,
        issuer,
        obverseImageKey,
        reverseImageKey,
      }))
    },
    listIssuers: () =>
      orm
        .select()
        .from(schema.issuers)
        .orderBy(asc(schema.issuers.name), asc(schema.issuers.code)),
    orm,
    schema,
  }
}
