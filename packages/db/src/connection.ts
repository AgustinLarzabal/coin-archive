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

const POSTGRES_INTEGER_MIN = -2_147_483_648
const POSTGRES_INTEGER_MAX = 2_147_483_647

export interface Database {
  checkReadiness: () => Promise<void>
  close: () => Promise<void>
  findCoinById: (coinId: string) => Promise<Coin | null>
  listCoins: (options?: CoinListOptions) => Promise<CoinListPage>
  hasShape: (slug: string) => Promise<boolean>
  listShapes: () => Promise<Array<schema.CoinShapeRecord>>
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

export type Coin = Omit<
  schema.CoinRecord,
  "distributionId" | "compositionId" | "shapeId" | "techniqueId"
> & {
  distribution: string
  distributionName: string
  composition: string | null
  compositionName: string | null
  shape: string | null
  shapeName: string | null
  technique: string | null
  techniqueName: string | null
  issuer: schema.IssuerRecord
  denomination: CoinDenomination | null
  rulingAuthorityAttributions: Array<CoinRulingAuthorityAttribution>
  mints: Array<schema.MintRecord & { country: schema.IssuerRecord }>
  tags: Array<Pick<schema.TagRecord, "slug" | "name">>
  obverse: CoinSurfaceWithEngravers | null
  reverse: CoinSurfaceWithEngravers | null
  edge: schema.CoinSurfaceRecord | null
}

export type CoinDenomination = schema.DenominationRecord & {
  currency: schema.CurrencyRecord
}

export type CoinRulingAuthorityAttribution = Pick<
  schema.RulingAuthorityRecord,
  "slug" | "name"
> & {
  role: string
  tenure: string | null
}

export type CoinSurfaceWithEngravers = schema.CoinSurfaceRecord & {
  engravers: Array<schema.EngraverRecord>
}

export type CoinListItem = Omit<
  schema.CoinRecord,
  | "denominationId"
  | "distributionId"
  | "compositionId"
  | "compositionDetail"
  | "size"
  | "thickness"
  | "weight"
  | "shapeId"
  | "techniqueId"
> & {
  distribution: string
  issuer: schema.IssuerRecord
  denomination: CoinDenomination | null
  obverseImageKey: string | null
  reverseImageKey: string | null
}

export interface CoinListOptions {
  sizeInterval?: { min: string; max: string }
  thicknessInterval?: { min: string; max: string }
  weightInterval?: { min: string; max: string }
  currencySlug?: string
  faceValueAmount?: string
  distribution?: string
  technique?: string
  tagSlug?: string
  composition?: string
  shape?: string
  engraverSlug?: string
  issueYearInterval?: IssueYearInterval
  issuerCode?: string
  mintSlug?: string
  page?: number
  pageSize?: number
  rulingAuthoritySlug?: string
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
      return orm.transaction(
        async (transaction) => {
          const rows = await transaction
            .select({
              coin: schema.coins,
              distribution: schema.distributions.slug,
              distributionName: schema.distributions.name,
              composition: schema.compositions.slug,
              compositionName: schema.compositions.name,
              shape: schema.coinShapes.slug,
              shapeName: schema.coinShapes.name,
              technique: schema.coinTechniques.slug,
              techniqueName: schema.coinTechniques.name,
              issuer: schema.issuers,
              denomination: schema.denominations,
              currency: schema.currencies,
              obverse: obverses,
              reverse: reverses,
              edge: edges,
            })
            .from(schema.coins)
            .innerJoin(
              schema.issuers,
              eq(schema.coins.issuerId, schema.issuers.id)
            )
            .innerJoin(
              schema.distributions,
              eq(schema.coins.distributionId, schema.distributions.id)
            )
            .leftJoin(
              schema.compositions,
              eq(schema.coins.compositionId, schema.compositions.id)
            )
            .leftJoin(
              schema.coinShapes,
              eq(schema.coins.shapeId, schema.coinShapes.id)
            )
            .leftJoin(
              schema.coinTechniques,
              eq(schema.coins.techniqueId, schema.coinTechniques.id)
            )
            .leftJoin(
              schema.denominations,
              eq(schema.coins.denominationId, schema.denominations.id)
            )
            .leftJoin(
              schema.currencies,
              eq(schema.denominations.currencyId, schema.currencies.id)
            )
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
              : await transaction
                  .select({
                    coinSurfaceId: schema.coinSurfaceEngravers.coinSurfaceId,
                    engraver: schema.engravers,
                  })
                  .from(schema.coinSurfaceEngravers)
                  .innerJoin(
                    schema.engravers,
                    eq(
                      schema.coinSurfaceEngravers.engraverId,
                      schema.engravers.id
                    )
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
          const rulingAuthorityAttributions = await transaction
            .select({
              slug: schema.rulingAuthorities.slug,
              name: schema.rulingAuthorities.name,
              role: schema.coinRulingAuthorityAttributions.role,
              tenure: schema.coinRulingAuthorityAttributions.tenure,
            })
            .from(schema.coinRulingAuthorityAttributions)
            .innerJoin(
              schema.rulingAuthorities,
              eq(
                schema.coinRulingAuthorityAttributions.rulingAuthorityId,
                schema.rulingAuthorities.id
              )
            )
            .where(
              eq(schema.coinRulingAuthorityAttributions.coinId, row.coin.id)
            )
            .orderBy(asc(schema.coinRulingAuthorityAttributions.position))

          const mints = await transaction
            .select({ mint: schema.mints, country: schema.issuers })
            .from(schema.coinMints)
            .innerJoin(
              schema.mints,
              eq(schema.coinMints.mintId, schema.mints.id)
            )
            .innerJoin(
              schema.issuers,
              eq(schema.mints.countryId, schema.issuers.id)
            )
            .where(eq(schema.coinMints.coinId, row.coin.id))
            .orderBy(asc(schema.mints.name), asc(schema.mints.slug))

          const tags = await transaction
            .select({ slug: schema.tags.slug, name: schema.tags.name })
            .from(schema.coinTags)
            .innerJoin(schema.tags, eq(schema.coinTags.tagId, schema.tags.id))
            .where(eq(schema.coinTags.coinId, row.coin.id))
            .orderBy(asc(schema.tags.name), asc(schema.tags.slug))

          const {
            distributionId: _distributionId,
            compositionId: _compositionId,
            shapeId: _shapeId,
            techniqueId: _techniqueId,
            ...publicCoin
          } = row.coin
          return {
            ...publicCoin,
            distribution: row.distribution,
            distributionName: row.distributionName,
            composition: row.composition,
            compositionName: row.compositionName,
            shape: row.shape,
            shapeName: row.shapeName,
            technique: row.technique,
            techniqueName: row.techniqueName,
            issuer: row.issuer,
            denomination:
              row.denomination && row.currency
                ? { ...row.denomination, currency: row.currency }
                : null,
            rulingAuthorityAttributions,
            mints: mints.map(({ mint, country }) => ({ ...mint, country })),
            tags,
            obverse: withEngravers(row.obverse),
            reverse: withEngravers(row.reverse),
            edge: row.edge,
          }
        },
        {
          accessMode: "read only",
          isolationLevel: "repeatable read",
        }
      )
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
      if (
        listOptions.faceValueAmount !== undefined &&
        listOptions.currencySlug === undefined
      ) {
        throw new RangeError("faceValueAmount requires currencySlug")
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
      const persistedIssueYearInterval = issueYearInterval && {
        firstIssueYear: Math.max(
          issueYearInterval.firstIssueYear,
          POSTGRES_INTEGER_MIN
        ),
        lastIssueYear: Math.min(
          issueYearInterval.lastIssueYear,
          POSTGRES_INTEGER_MAX
        ),
      }
      if (
        persistedIssueYearInterval &&
        persistedIssueYearInterval.firstIssueYear >
          persistedIssueYearInterval.lastIssueYear
      ) {
        return { coins: [], totalItems: 0 }
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
          const currencyId =
            listOptions.currencySlug === undefined
              ? undefined
              : ((
                  await transaction
                    .select({ id: schema.currencies.id })
                    .from(schema.currencies)
                    .where(eq(schema.currencies.slug, listOptions.currencySlug))
                    .limit(1)
                ).at(0)?.id ?? null)
          const rulingAuthorityId =
            listOptions.rulingAuthoritySlug === undefined
              ? undefined
              : ((
                  await transaction
                    .select({ id: schema.rulingAuthorities.id })
                    .from(schema.rulingAuthorities)
                    .where(
                      eq(
                        schema.rulingAuthorities.slug,
                        listOptions.rulingAuthoritySlug
                      )
                    )
                    .limit(1)
                ).at(0)?.id ?? null)
          const distributionId =
            listOptions.distribution === undefined
              ? undefined
              : ((
                  await transaction
                    .select({ id: schema.distributions.id })
                    .from(schema.distributions)
                    .where(
                      eq(schema.distributions.slug, listOptions.distribution)
                    )
                    .limit(1)
                ).at(0)?.id ?? null)
          const compositionId =
            listOptions.composition === undefined
              ? undefined
              : ((
                  await transaction
                    .select({ id: schema.compositions.id })
                    .from(schema.compositions)
                    .where(
                      eq(schema.compositions.slug, listOptions.composition)
                    )
                    .limit(1)
                ).at(0)?.id ?? null)
          const techniqueId =
            listOptions.technique === undefined
              ? undefined
              : ((
                  await transaction
                    .select({ id: schema.coinTechniques.id })
                    .from(schema.coinTechniques)
                    .where(
                      eq(schema.coinTechniques.slug, listOptions.technique)
                    )
                    .limit(1)
                ).at(0)?.id ?? null)
          const shapeId =
            listOptions.shape === undefined
              ? undefined
              : ((
                  await transaction
                    .select({ id: schema.coinShapes.id })
                    .from(schema.coinShapes)
                    .where(eq(schema.coinShapes.slug, listOptions.shape))
                    .limit(1)
                ).at(0)?.id ?? null)
          const coinFilterPredicate = () =>
            and(
              listOptions.sizeInterval === undefined
                ? undefined
                : gte(schema.coins.size, sql`${listOptions.sizeInterval.min}`),
              listOptions.sizeInterval === undefined
                ? undefined
                : lte(schema.coins.size, sql`${listOptions.sizeInterval.max}`),
              listOptions.thicknessInterval === undefined
                ? undefined
                : gte(
                    schema.coins.thickness,
                    sql`${listOptions.thicknessInterval.min}`
                  ),
              listOptions.thicknessInterval === undefined
                ? undefined
                : lte(
                    schema.coins.thickness,
                    sql`${listOptions.thicknessInterval.max}`
                  ),
              listOptions.weightInterval === undefined
                ? undefined
                : gte(
                    schema.coins.weight,
                    sql`${listOptions.weightInterval.min}`
                  ),
              listOptions.weightInterval === undefined
                ? undefined
                : lte(
                    schema.coins.weight,
                    sql`${listOptions.weightInterval.max}`
                  ),
              distributionId === undefined
                ? undefined
                : distributionId === null
                  ? sql`false`
                  : eq(schema.coins.distributionId, distributionId),
              techniqueId === undefined
                ? undefined
                : techniqueId === null
                  ? sql`false`
                  : eq(schema.coins.techniqueId, techniqueId),
              compositionId === undefined
                ? undefined
                : compositionId === null
                  ? sql`false`
                  : eq(schema.coins.compositionId, compositionId),
              shapeId === undefined
                ? undefined
                : shapeId === null
                  ? sql`false`
                  : eq(schema.coins.shapeId, shapeId),
              listOptions.tagSlug === undefined
                ? undefined
                : exists(
                    transaction
                      .select({ coinId: schema.coinTags.coinId })
                      .from(schema.coinTags)
                      .innerJoin(
                        schema.tags,
                        eq(schema.coinTags.tagId, schema.tags.id)
                      )
                      .where(
                        and(
                          eq(schema.coinTags.coinId, schema.coins.id),
                          eq(schema.tags.slug, listOptions.tagSlug)
                        )
                      )
                  ),
              currencyId === undefined
                ? undefined
                : currencyId === null
                  ? sql`false`
                  : exists(
                      transaction
                        .select({ id: schema.denominations.id })
                        .from(schema.denominations)
                        .where(
                          and(
                            eq(
                              schema.denominations.id,
                              schema.coins.denominationId
                            ),
                            eq(schema.denominations.currencyId, currencyId),
                            listOptions.faceValueAmount === undefined
                              ? undefined
                              : eq(
                                  schema.denominations.amount,
                                  listOptions.faceValueAmount
                                )
                          )
                        )
                    ),
              issuerId === undefined
                ? undefined
                : issuerId === null
                  ? sql`false`
                  : eq(schema.coins.issuerId, issuerId),
              listOptions.mintSlug === undefined
                ? undefined
                : exists(
                    transaction
                      .select({ coinId: schema.coinMints.coinId })
                      .from(schema.coinMints)
                      .innerJoin(
                        schema.mints,
                        eq(schema.coinMints.mintId, schema.mints.id)
                      )
                      .where(
                        and(
                          eq(schema.coinMints.coinId, schema.coins.id),
                          eq(schema.mints.slug, listOptions.mintSlug)
                        )
                      )
                  ),
              persistedIssueYearInterval === undefined
                ? undefined
                : and(
                    lte(
                      schema.coins.firstIssueYear,
                      persistedIssueYearInterval.lastIssueYear
                    ),
                    gte(
                      schema.coins.lastIssueYear,
                      persistedIssueYearInterval.firstIssueYear
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
                  ),
              rulingAuthorityId === undefined
                ? undefined
                : rulingAuthorityId === null
                  ? sql`false`
                  : exists(
                      transaction
                        .select({
                          coinId: schema.coinRulingAuthorityAttributions.coinId,
                        })
                        .from(schema.coinRulingAuthorityAttributions)
                        .where(
                          and(
                            eq(
                              schema.coinRulingAuthorityAttributions.coinId,
                              schema.coins.id
                            ),
                            eq(
                              schema.coinRulingAuthorityAttributions
                                .rulingAuthorityId,
                              rulingAuthorityId
                            )
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
              distribution: schema.distributions.slug,
              issuer: schema.issuers,
              denomination: schema.denominations,
              currency: schema.currencies,
            })
            .from(schema.coins)
            .innerJoin(
              schema.issuers,
              eq(schema.coins.issuerId, schema.issuers.id)
            )
            .innerJoin(
              schema.distributions,
              eq(schema.coins.distributionId, schema.distributions.id)
            )
            .leftJoin(
              schema.denominations,
              eq(schema.coins.denominationId, schema.denominations.id)
            )
            .leftJoin(
              schema.currencies,
              eq(schema.denominations.currencyId, schema.currencies.id)
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
            coins: rows.map(
              ({ coin, distribution, currency, denomination, issuer }) => {
                const images = imagesByCoinId.get(coin.id)
                const {
                  denominationId: _denominationId,
                  distributionId: _distributionId,
                  compositionId: _compositionId,
                  compositionDetail: _compositionDetail,
                  shapeId: _shapeId,
                  techniqueId: _techniqueId,
                  ...publicCoin
                } = coin
                return {
                  ...publicCoin,
                  distribution,
                  issuer,
                  denomination:
                    denomination && currency
                      ? { ...denomination, currency }
                      : null,
                  obverseImageKey: images?.obverse ?? null,
                  reverseImageKey: images?.reverse ?? null,
                }
              }
            ),
            totalItems,
          }
        },
        { accessMode: "read only", isolationLevel: "repeatable read" }
      )
    },
    listCurrencies: () =>
      orm
        .select()
        .from(schema.currencies)
        .orderBy(
          asc(
            sql`${schema.currencies.name} || ' (' || ${schema.currencies.periodLabel} || ')'`
          )
        ),
    listDistributions: () =>
      orm
        .select()
        .from(schema.distributions)
        .orderBy(
          asc(schema.distributions.name),
          asc(schema.distributions.slug)
        ),
    listTags: () =>
      orm
        .select()
        .from(schema.tags)
        .orderBy(asc(schema.tags.name), asc(schema.tags.slug)),
    listCompositions: () =>
      orm
        .select()
        .from(schema.compositions)
        .orderBy(asc(schema.compositions.name), asc(schema.compositions.slug)),
    hasShape: async (slug) =>
      (
        await orm
          .select({ id: schema.coinShapes.id })
          .from(schema.coinShapes)
          .where(eq(schema.coinShapes.slug, slug))
          .limit(1)
      ).length > 0,
    listShapes: () =>
      orm
        .select()
        .from(schema.coinShapes)
        .orderBy(asc(schema.coinShapes.name), asc(schema.coinShapes.slug)),
    listTechniques: () =>
      orm
        .select()
        .from(schema.coinTechniques)
        .orderBy(
          asc(schema.coinTechniques.name),
          asc(schema.coinTechniques.slug)
        ),
    listMints: async () =>
      (
        await orm
          .select({ mint: schema.mints, country: schema.issuers })
          .from(schema.mints)
          .innerJoin(
            schema.issuers,
            eq(schema.mints.countryId, schema.issuers.id)
          )
          .orderBy(asc(schema.mints.name), asc(schema.mints.slug))
      ).map(({ mint, country }) => ({ ...mint, country })),
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
    listRulingAuthorities: () =>
      orm
        .select()
        .from(schema.rulingAuthorities)
        .orderBy(
          asc(schema.rulingAuthorities.name),
          asc(schema.rulingAuthorities.slug)
        ),
    orm,
    schema,
  }
}
