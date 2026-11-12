import { and, eq, exists, gte, inArray, lte, sql } from "drizzle-orm"

import * as schema from "../schema/index.js"
import type { Database } from "../connection.js"
import type { CoinListOptions, IssueYearInterval } from "./coin-list-types.js"

type CoinListTransaction = Parameters<
  Parameters<Database["orm"]["transaction"]>[0]
>[0]

async function resolveFilterIds(
  transaction: CoinListTransaction,
  listOptions: CoinListOptions
) {
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
              eq(schema.rulingAuthorities.slug, listOptions.rulingAuthoritySlug)
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
            .where(eq(schema.distributions.slug, listOptions.distribution))
            .limit(1)
        ).at(0)?.id ?? null)

  const compositionId =
    listOptions.composition === undefined
      ? undefined
      : ((
          await transaction
            .select({ id: schema.compositions.id })
            .from(schema.compositions)
            .where(eq(schema.compositions.slug, listOptions.composition))
            .limit(1)
        ).at(0)?.id ?? null)

  const techniqueId =
    listOptions.technique === undefined
      ? undefined
      : ((
          await transaction
            .select({ id: schema.coinTechniques.id })
            .from(schema.coinTechniques)
            .where(eq(schema.coinTechniques.slug, listOptions.technique))
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

  const orientationId =
    listOptions.orientation === undefined
      ? undefined
      : ((
          await transaction
            .select({ id: schema.coinOrientations.id })
            .from(schema.coinOrientations)
            .where(eq(schema.coinOrientations.slug, listOptions.orientation))
            .limit(1)
        ).at(0)?.id ?? null)

  return {
    issuerId,
    currencyId,
    rulingAuthorityId,
    distributionId,
    compositionId,
    techniqueId,
    shapeId,
    orientationId,
  }
}

type ResolvedFilterIds = Awaited<ReturnType<typeof resolveFilterIds>>

function scalarPredicate(
  listOptions: CoinListOptions,
  ids: ResolvedFilterIds,
  persistedIssueYearInterval: IssueYearInterval | undefined
) {
  return and(
    listOptions.sizeInterval === undefined
      ? undefined
      : gte(schema.coins.size, sql`${listOptions.sizeInterval.min}`),
    listOptions.sizeInterval === undefined
      ? undefined
      : lte(schema.coins.size, sql`${listOptions.sizeInterval.max}`),
    listOptions.thicknessInterval === undefined
      ? undefined
      : gte(schema.coins.thickness, sql`${listOptions.thicknessInterval.min}`),
    listOptions.thicknessInterval === undefined
      ? undefined
      : lte(schema.coins.thickness, sql`${listOptions.thicknessInterval.max}`),
    listOptions.weightInterval === undefined
      ? undefined
      : gte(schema.coins.weight, sql`${listOptions.weightInterval.min}`),
    listOptions.weightInterval === undefined
      ? undefined
      : lte(schema.coins.weight, sql`${listOptions.weightInterval.max}`),
    ids.distributionId === undefined
      ? undefined
      : ids.distributionId === null
        ? sql`false`
        : eq(schema.coins.distributionId, ids.distributionId),
    ids.techniqueId === undefined
      ? undefined
      : ids.techniqueId === null
        ? sql`false`
        : eq(schema.coins.techniqueId, ids.techniqueId),
    ids.compositionId === undefined
      ? undefined
      : ids.compositionId === null
        ? sql`false`
        : eq(schema.coins.compositionId, ids.compositionId),
    ids.shapeId === undefined
      ? undefined
      : ids.shapeId === null
        ? sql`false`
        : eq(schema.coins.shapeId, ids.shapeId),
    ids.orientationId === undefined
      ? undefined
      : ids.orientationId === null
        ? sql`false`
        : eq(schema.coins.orientationId, ids.orientationId),
    ids.issuerId === undefined
      ? undefined
      : ids.issuerId === null
        ? sql`false`
        : eq(schema.coins.issuerId, ids.issuerId),
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
        )
  )
}

function relatedPredicate(
  transaction: CoinListTransaction,
  listOptions: CoinListOptions,
  ids: ResolvedFilterIds
) {
  return and(
    listOptions.tagSlug === undefined
      ? undefined
      : exists(
          transaction
            .select({ coinId: schema.coinTags.coinId })
            .from(schema.coinTags)
            .innerJoin(schema.tags, eq(schema.coinTags.tagId, schema.tags.id))
            .where(
              and(
                eq(schema.coinTags.coinId, schema.coins.id),
                eq(schema.tags.slug, listOptions.tagSlug)
              )
            )
        ),
    ids.currencyId === undefined
      ? undefined
      : ids.currencyId === null
        ? sql`false`
        : exists(
            transaction
              .select({ id: schema.denominations.id })
              .from(schema.denominations)
              .where(
                and(
                  eq(schema.denominations.id, schema.coins.denominationId),
                  eq(schema.denominations.currencyId, ids.currencyId),
                  listOptions.faceValueAmount === undefined
                    ? undefined
                    : eq(
                        schema.denominations.amount,
                        listOptions.faceValueAmount
                      )
                )
              )
          ),
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
    listOptions.engraverSlug === undefined
      ? undefined
      : exists(
          transaction
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
              eq(schema.coinSurfaceEngravers.engraverId, schema.engravers.id)
            )
            .where(
              and(
                eq(schema.coinSurfaces.coinId, schema.coins.id),
                inArray(schema.coinSurfaces.kind, ["obverse", "reverse"]),
                eq(schema.engravers.slug, listOptions.engraverSlug)
              )
            )
        ),
    ids.rulingAuthorityId === undefined
      ? undefined
      : ids.rulingAuthorityId === null
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
                    schema.coinRulingAuthorityAttributions.rulingAuthorityId,
                    ids.rulingAuthorityId
                  )
                )
              )
          )
  )
}

export async function createCoinFilter(
  transaction: CoinListTransaction,
  listOptions: CoinListOptions,
  persistedIssueYearInterval: IssueYearInterval | undefined
) {
  const ids = await resolveFilterIds(transaction, listOptions)

  return () =>
    and(
      scalarPredicate(listOptions, ids, persistedIssueYearInterval),
      relatedPredicate(transaction, listOptions, ids)
    )
}
