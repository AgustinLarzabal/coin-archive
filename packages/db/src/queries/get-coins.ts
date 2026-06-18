import { and, asc, desc, eq, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import { db } from "../client"
import { coin } from "../schema/coin"
import { coinSurface } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
import { distribution } from "../schema/distribution"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import type { CoinListRecord } from "./map-get-coins-row"
import { mapGetCoinsRowsToCoinRecords } from "./map-get-coins-row"

const defaultGetCoinsLimit = 15

export type GetCoinsOptions = {
  distributionCode?: string
  engraverCode?: string
  issuerCode?: string
  limit?: number
}

function buildDistributionFilter(
  distributionCode: string | undefined
): SQL | undefined {
  const normalizedDistributionCode = distributionCode?.trim().toLowerCase()

  if (!normalizedDistributionCode) {
    return undefined
  }

  return sql`
    ${coin.distributionId} in (
      select ${distribution.id}
      from ${distribution}
      where lower(${distribution.code}) = ${normalizedDistributionCode}
    )
  `
}

function buildEngraverFilter(
  engraverCode: string | undefined
): SQL | undefined {
  const normalizedEngraverCode = engraverCode?.trim().toLowerCase()

  if (!normalizedEngraverCode) {
    return undefined
  }

  return sql`
    exists (
      select 1
      from "coin_surface"
      inner join "coin_face_engraver"
        on "coin_face_engraver"."coin_face_id" = "coin_surface"."id"
       and "coin_face_engraver"."coin_face_kind" = "coin_surface"."kind"
      inner join "engraver"
        on "engraver"."id" = "coin_face_engraver"."engraver_id"
      where "coin_surface"."coin_id" = ${coin.id}
        and lower("engraver"."code") = ${normalizedEngraverCode}
    )
  `
}

function buildIssuerTreeFilter(
  issuerCode: string | undefined
): SQL | undefined {
  const normalizedIssuerCode = issuerCode?.trim().toLowerCase()

  if (!normalizedIssuerCode) {
    return undefined
  }

  return sql`
    ${coin.issuerId} in (
      with recursive issuer_tree(id) as (
        select "issuer"."id"
        from "issuer"
        where "issuer"."code" = ${normalizedIssuerCode}
        union
        select "child_issuer"."id"
        from "issuer" as "child_issuer"
        inner join issuer_tree on "child_issuer"."parent_issuer_id" = issuer_tree.id
      )
      select issuer_tree.id
      from issuer_tree
    )
  `
}

export function buildGetCoinsQuery(
  database: typeof db,
  options: GetCoinsOptions = {}
) {
  const {
    distributionCode,
    engraverCode,
    issuerCode,
    limit = defaultGetCoinsLimit,
  } = options
  const distributionFilter = buildDistributionFilter(distributionCode)
  const engraverFilter = buildEngraverFilter(engraverCode)
  const issuerFilter = buildIssuerTreeFilter(issuerCode)
  const filters = [distributionFilter, issuerFilter, engraverFilter].filter(
    (filter): filter is SQL => filter !== undefined
  )
  const limitedCoinsQuery = database
    .select({
      id: coin.id,
      title: coin.title,
      issuerId: coin.issuerId,
      createdAt: coin.createdAt,
    })
    .from(coin)
    .orderBy(desc(coin.createdAt))
    .limit(limit)

  const filteredLimitedCoinsQuery =
    filters.length > 0
      ? limitedCoinsQuery.where(and(...filters))
      : limitedCoinsQuery

  const limitedCoins = filteredLimitedCoinsQuery.as("limited_coins")

  return database
    .select({
      id: limitedCoins.id,
      title: limitedCoins.title,
      issuerId: issuer.id,
      issuerCode: issuer.code,
      issuerIsoCode: issuer.isoCode,
      issuerName: issuer.name,
      surfaceKind: coinSurface.kind,
      surfaceDescription: coinSurface.description,
      surfaceLettering: coinSurface.lettering,
      surfaceThumbnailUrl: coinSurface.thumbnailUrl,
      surfaceImageUrl: coinSurface.imageUrl,
      engraverId: engraver.id,
      engraverCode: engraver.code,
      engraverName: engraver.name,
    })
    .from(limitedCoins)
    .innerJoin(issuer, eq(limitedCoins.issuerId, issuer.id))
    .leftJoin(coinSurface, eq(coinSurface.coinId, limitedCoins.id))
    .leftJoin(
      coinSurfaceEngraver,
      and(
        eq(coinSurfaceEngraver.coinSurfaceId, coinSurface.id),
        eq(coinSurfaceEngraver.coinSurfaceKind, coinSurface.kind)
      )
    )
    .leftJoin(engraver, eq(coinSurfaceEngraver.engraverId, engraver.id))
    .orderBy(
      desc(limitedCoins.createdAt),
      asc(coinSurface.kind),
      asc(engraver.name),
      asc(engraver.code)
    )
}

export async function getCoins(
  options: GetCoinsOptions = {}
): Promise<CoinListRecord[]> {
  const rows = await buildGetCoinsQuery(db, options)

  return mapGetCoinsRowsToCoinRecords(rows)
}
