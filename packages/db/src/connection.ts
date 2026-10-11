import { and, asc, desc, eq, exists, inArray, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { alias } from "drizzle-orm/pg-core"
import { Pool } from "pg"

import * as schema from "./schema/index.js"

export interface Database {
  checkReadiness: () => Promise<void>
  close: () => Promise<void>
  findCoinById: (coinId: string) => Promise<Coin | null>
  listCoins: (options?: CoinListOptions) => Promise<Array<CoinListItem>>
  listEngravers: () => Promise<Array<schema.EngraverRecord>>
  listIssuers: () => Promise<Array<schema.IssuerRecord>>
  orm: ReturnType<typeof drizzle<typeof schema>>
  schema: typeof schema
}

export type Coin = schema.CoinRecord & {
  issuer: schema.IssuerRecord
  obverse: CoinSurfaceWithEngravers | null
  reverse: CoinSurfaceWithEngravers | null
  edge: schema.CoinSurfaceRecord | null
}

export type CoinSurfaceWithEngravers = schema.CoinSurfaceRecord & {
  engravers: Array<schema.EngraverRecord>
}

export type CoinListItem = schema.CoinRecord & {
  issuer: schema.IssuerRecord
  obverseImageKey: string | null
  reverseImageKey: string | null
}

export interface CoinListOptions {
  engraverSlug?: string
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
  const edges = alias(schema.coinSurfaces, "edges")

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
          edge: edges,
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
        .leftJoin(
          edges,
          and(eq(edges.coinId, schema.coins.id), eq(edges.kind, "edge"))
        )
        .where(eq(schema.coins.id, coinId))
        .limit(1)
      const row = rows.at(0)
      if (!row) return null

      const engraverCreditableSurfaces = [row.obverse, row.reverse].filter(
        (surface): surface is schema.CoinSurfaceRecord => surface !== null
      )
      const credits =
        engraverCreditableSurfaces.length === 0
          ? []
          : await orm
              .select({
                coinSurfaceId: schema.coinSurfaceEngravers.coinSurfaceId,
                engraver: schema.engravers,
              })
              .from(schema.coinSurfaceEngravers)
              .innerJoin(
                schema.engravers,
                eq(schema.coinSurfaceEngravers.engraverId, schema.engravers.id)
              )
              .where(
                inArray(
                  schema.coinSurfaceEngravers.coinSurfaceId,
                  engraverCreditableSurfaces.map((surface) => surface.id)
                )
              )
              .orderBy(
                asc(schema.coinSurfaceEngravers.coinSurfaceId),
                asc(schema.coinSurfaceEngravers.position)
              )
      const withEngravers = (surface: schema.CoinSurfaceRecord | null) =>
        surface
          ? {
              ...surface,
              engravers: credits
                .filter((credit) => credit.coinSurfaceId === surface.id)
                .map((credit) => credit.engraver),
            }
          : null

      return {
        ...row.coin,
        issuer: row.issuer,
        obverse: withEngravers(row.obverse),
        reverse: withEngravers(row.reverse),
        edge: row.edge,
      }
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
          and(
            filters.issuerCode === undefined
              ? undefined
              : eq(schema.issuers.code, filters.issuerCode),
            filters.engraverSlug === undefined
              ? undefined
              : exists(
                  orm
                    .select({
                      coinSurfaceId: schema.coinSurfaceEngravers.coinSurfaceId,
                    })
                    .from(schema.coinSurfaceEngravers)
                    .innerJoin(
                      schema.coinSurfaces,
                      eq(
                        schema.coinSurfaceEngravers.coinSurfaceId,
                        schema.coinSurfaces.id
                      )
                    )
                    .innerJoin(
                      schema.engravers,
                      eq(
                        schema.coinSurfaceEngravers.engraverId,
                        schema.engravers.id
                      )
                    )
                    .where(
                      and(
                        eq(schema.coinSurfaces.coinId, schema.coins.id),
                        inArray(schema.coinSurfaces.kind, [
                          "obverse",
                          "reverse",
                        ]),
                        eq(schema.engravers.slug, filters.engraverSlug)
                      )
                    )
                )
          )
        )
        .orderBy(desc(schema.coins.createdAt), asc(schema.coins.id))
      return rows.map(({ coin, issuer, obverseImageKey, reverseImageKey }) => ({
        ...coin,
        issuer,
        obverseImageKey,
        reverseImageKey,
      }))
    },
    listEngravers: () =>
      orm
        .select()
        .from(schema.engravers)
        .orderBy(asc(schema.engravers.fullName), asc(schema.engravers.slug)),
    listIssuers: () =>
      orm
        .select()
        .from(schema.issuers)
        .orderBy(asc(schema.issuers.name), asc(schema.issuers.code)),
    orm,
    schema,
  }
}
