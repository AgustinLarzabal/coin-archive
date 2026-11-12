import { and, eq, exists, gte, inArray, lte, sql } from "drizzle-orm"

import * as schema from "../schema/index.js"
import type { Database } from "../connection.js"
import type { CoinListOptions, IssueYearInterval } from "./coin-list-types.js"

type CoinListTransaction = Parameters<
  Parameters<Database["orm"]["transaction"]>[0]
>[0]

function scalarPredicate(
  transaction: CoinListTransaction,
  listOptions: CoinListOptions,
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
    listOptions.distribution === undefined
      ? undefined
      : inArray(
          schema.coins.distributionId,
          transaction
            .select({ id: schema.distributions.id })
            .from(schema.distributions)
            .where(eq(schema.distributions.slug, listOptions.distribution))
        ),
    listOptions.technique === undefined
      ? undefined
      : inArray(
          schema.coins.techniqueId,
          transaction
            .select({ id: schema.coinTechniques.id })
            .from(schema.coinTechniques)
            .where(eq(schema.coinTechniques.slug, listOptions.technique))
        ),
    listOptions.composition === undefined
      ? undefined
      : inArray(
          schema.coins.compositionId,
          transaction
            .select({ id: schema.compositions.id })
            .from(schema.compositions)
            .where(eq(schema.compositions.slug, listOptions.composition))
        ),
    listOptions.shape === undefined
      ? undefined
      : inArray(
          schema.coins.shapeId,
          transaction
            .select({ id: schema.coinShapes.id })
            .from(schema.coinShapes)
            .where(eq(schema.coinShapes.slug, listOptions.shape))
        ),
    listOptions.orientation === undefined
      ? undefined
      : inArray(
          schema.coins.orientationId,
          transaction
            .select({ id: schema.coinOrientations.id })
            .from(schema.coinOrientations)
            .where(eq(schema.coinOrientations.slug, listOptions.orientation))
        ),
    listOptions.issuerCode === undefined
      ? undefined
      : inArray(
          schema.coins.issuerId,
          transaction
            .select({ id: schema.issuers.id })
            .from(schema.issuers)
            .where(eq(schema.issuers.code, listOptions.issuerCode))
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
        )
  )
}

function relatedPredicate(
  transaction: CoinListTransaction,
  listOptions: CoinListOptions
) {
  return and(
    ...(listOptions.tagSlugs ?? []).map((slug) =>
      exists(
        transaction
          .select({ coinId: schema.coinTags.coinId })
          .from(schema.coinTags)
          .innerJoin(schema.tags, eq(schema.coinTags.tagId, schema.tags.id))
          .where(
            and(
              eq(schema.coinTags.coinId, schema.coins.id),
              eq(schema.tags.slug, slug)
            )
          )
      )
    ),
    listOptions.currencySlug === undefined
      ? undefined
      : exists(
          transaction
            .select({ id: schema.denominations.id })
            .from(schema.denominations)
            .where(
              and(
                eq(schema.denominations.id, schema.coins.denominationId),
                inArray(
                  schema.denominations.currencyId,
                  transaction
                    .select({ id: schema.currencies.id })
                    .from(schema.currencies)
                    .where(eq(schema.currencies.slug, listOptions.currencySlug))
                ),
                listOptions.faceValueAmount === undefined
                  ? undefined
                  : eq(schema.denominations.amount, listOptions.faceValueAmount)
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
    listOptions.rulingAuthoritySlug === undefined
      ? undefined
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
                inArray(
                  schema.coinRulingAuthorityAttributions.rulingAuthorityId,
                  transaction
                    .select({ id: schema.rulingAuthorities.id })
                    .from(schema.rulingAuthorities)
                    .where(
                      eq(
                        schema.rulingAuthorities.slug,
                        listOptions.rulingAuthoritySlug
                      )
                    )
                )
              )
            )
        )
  )
}

export function createCoinFilter(
  transaction: CoinListTransaction,
  listOptions: CoinListOptions,
  persistedIssueYearInterval: IssueYearInterval | undefined
) {
  return () =>
    and(
      scalarPredicate(transaction, listOptions, persistedIssueYearInterval),
      relatedPredicate(transaction, listOptions)
    )
}
