import { and, asc, desc, eq, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import { db } from "../client"
import { coin } from "../schema/coin"
import { coinSurface } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import type { CoinListRecord } from "./map-get-coins-row"
import { mapGetCoinsRowsToCoinRecords } from "./map-get-coins-row"

const defaultGetCoinsLimit = 15

export type GetCoinsOptions = {
  issuerCode?: string
  limit?: number
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
  const { issuerCode, limit = defaultGetCoinsLimit } = options
  const issuerFilter = buildIssuerTreeFilter(issuerCode)
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

  const filteredLimitedCoinsQuery = issuerFilter
    ? limitedCoinsQuery.where(issuerFilter)
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
