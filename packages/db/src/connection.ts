import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { alias } from "drizzle-orm/pg-core"
import { Pool } from "pg"

import * as schema from "./schema/index.js"

export interface Database {
  checkReadiness: () => Promise<void>
  close: () => Promise<void>
  findCoinById: (coinId: string) => Promise<Coin | null>
  listCoins: (options?: CoinListOptions) => Promise<CoinListPage>
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
  issueYearInterval?: IssueYearInterval
  issuerCode?: string
  page?: number
  pageSize?: number
}

export interface IssueYearInterval {
  firstIssueYear: number
  lastIssueYear: number
}

export interface CoinListPage {
  coins: Array<CoinListItem>
  totalItems: number
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
    async listCoins(listOptions = {}) {
      const page = listOptions.page ?? 1
      const pageSize = listOptions.pageSize ?? 24
      if (!Number.isSafeInteger(page) || page < 1) {
        throw new RangeError("page must be a positive safe integer")
      }
      if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
        throw new RangeError("pageSize must be an integer between 1 and 100")
      }
      const issueYearInterval = listOptions.issueYearInterval
      if (
        issueYearInterval &&
        (!Number.isSafeInteger(issueYearInterval.firstIssueYear) ||
          !Number.isSafeInteger(issueYearInterval.lastIssueYear) ||
          issueYearInterval.firstIssueYear === 0 ||
          issueYearInterval.lastIssueYear === 0 ||
          issueYearInterval.firstIssueYear > issueYearInterval.lastIssueYear)
      ) {
        throw new RangeError("issueYearInterval must be an ordered interval")
      }

      return orm.transaction(
        async (transaction) => {
          const issuerId =
            listOptions.issuerCode === undefined
              ? undefined
              : ((
                  await transaction
                    .select({ id: schema.issuers.id })
                    .from(schema.issuers)
                    .where(eq(schema.issuers.code, listOptions.issuerCode))
                    .limit(1)
                ).at(0)?.id ?? null)
          const coinFilterPredicate = () =>
            and(
              issuerId === undefined
                ? undefined
                : issuerId === null
                  ? sql`false`
                  : eq(schema.coins.issuerId, issuerId),
              issueYearInterval === undefined
                ? undefined
                : and(
                    lte(
                      schema.coins.firstIssueYear,
                      issueYearInterval.lastIssueYear
                    ),
                    gte(
                      schema.coins.lastIssueYear,
                      issueYearInterval.firstIssueYear
                    )
                  ),
              listOptions.engraverSlug === undefined
                ? undefined
                : exists(
                    transaction
                      .select({
                        coinSurfaceId:
                          schema.coinSurfaceEngravers.coinSurfaceId,
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
                          eq(schema.engravers.slug, listOptions.engraverSlug)
                        )
                      )
                  )
            )

          const [{ totalItems }] = await transaction
            .select({ totalItems: count() })
            .from(schema.coins)
            .where(coinFilterPredicate())
          const rows = await transaction
            .select({
              coin: schema.coins,
              issuer: schema.issuers,
            })
            .from(schema.coins)
            .innerJoin(
              schema.issuers,
              eq(schema.coins.issuerId, schema.issuers.id)
            )
            .where(coinFilterPredicate())
            .orderBy(desc(schema.coins.createdAt), asc(schema.coins.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize)

          const pageCoinIds = rows.map(({ coin }) => coin.id)
          const surfaceImages =
            pageCoinIds.length === 0
              ? []
              : await transaction
                  .select({
                    coinId: schema.coinSurfaces.coinId,
                    imageKey: schema.coinSurfaces.imageKey,
                    kind: schema.coinSurfaces.kind,
                  })
                  .from(schema.coinSurfaces)
                  .where(
                    and(
                      inArray(schema.coinSurfaces.coinId, pageCoinIds),
                      inArray(schema.coinSurfaces.kind, ["obverse", "reverse"])
                    )
                  )
          const imagesByCoinId = new Map<
            string,
            { obverse?: string | null; reverse?: string | null }
          >()
          for (const surface of surfaceImages) {
            if (surface.kind === "edge") continue
            const images = imagesByCoinId.get(surface.coinId) ?? {}
            images[surface.kind] = surface.imageKey
            imagesByCoinId.set(surface.coinId, images)
          }

          return {
            coins: rows.map(({ coin, issuer }) => {
              const images = imagesByCoinId.get(coin.id)
              return {
                ...coin,
                issuer,
                obverseImageKey: images?.obverse ?? null,
                reverseImageKey: images?.reverse ?? null,
              }
            }),
            totalItems,
          }
        },
        { accessMode: "read only", isolationLevel: "repeatable read" }
      )
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
