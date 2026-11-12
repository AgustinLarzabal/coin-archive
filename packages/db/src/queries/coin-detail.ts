import { and, asc, eq, inArray } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

import * as schema from "../schema/index.js"
import type { Database } from "../connection.js"
import type { Coin, CoinSurfaceWithEngravers } from "./coin-detail-types.js"

function withEngravers(
  surface: schema.CoinSurfaceRecord | null,
  credits: Array<{ coinSurfaceId: string; engraver: schema.EngraverRecord }>
): CoinSurfaceWithEngravers | null {
  return surface
    ? {
        ...surface,
        engravers: credits
          .filter((credit) => credit.coinSurfaceId === surface.id)
          .map((credit) => credit.engraver),
      }
    : null
}

export function createFindCoinById(orm: Database["orm"]) {
  const obverses = alias(schema.coinSurfaces, "obverses")
  const reverses = alias(schema.coinSurfaces, "reverses")
  const edges = alias(schema.coinSurfaces, "edges")

  return async function findCoinById(coinId: string): Promise<Coin | null> {
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
            orientation: schema.coinOrientations.name,
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
            schema.coinOrientations,
            eq(schema.coins.orientationId, schema.coinOrientations.id)
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
        const engraverCredits =
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

        const rulingAuthorityAttributions = await transaction
          .select({
            slug: schema.rulingAuthorities.slug,
            name: schema.rulingAuthorities.name,
            role: schema.rulingAuthorities.role,
            tenure: schema.rulingAuthorities.tenure,
          })
          .from(schema.coinRulingAuthorityAttributions)
          .innerJoin(
            schema.rulingAuthorities,
            eq(
              schema.coinRulingAuthorityAttributions.rulingAuthorityId,
              schema.rulingAuthorities.id
            )
          )
          .where(eq(schema.coinRulingAuthorityAttributions.coinId, row.coin.id))
          .orderBy(asc(schema.coinRulingAuthorityAttributions.position))

        const mints = await transaction
          .select({ mint: schema.mints, country: schema.issuers })
          .from(schema.coinMints)
          .innerJoin(schema.mints, eq(schema.coinMints.mintId, schema.mints.id))
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
          orientationId: _orientationId,
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
          orientation: row.orientation,
          issuer: row.issuer,
          denomination:
            row.denomination && row.currency
              ? { ...row.denomination, currency: row.currency }
              : null,
          rulingAuthorityAttributions,
          mints: mints.map(({ mint, country }) => ({ ...mint, country })),
          tags,
          obverse: withEngravers(row.obverse, engraverCredits),
          reverse: withEngravers(row.reverse, engraverCredits),
          edge: row.edge,
        }
      },
      {
        accessMode: "read only",
        isolationLevel: "repeatable read",
      }
    )
  }
}
