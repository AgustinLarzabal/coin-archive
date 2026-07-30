import { and, asc, desc, eq, ilike, lt, or, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import { db } from "../client"
import { coin } from "../schema/coin"
import { coinRuler } from "../schema/coin-ruler"
import { coinSurface } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
import { coinTheme } from "../schema/coin-theme"
import { distribution } from "../schema/distribution"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import { ruler } from "../schema/ruler"
import { theme } from "../schema/theme"
import type { CoinListRecord } from "./map-get-coins-row"
import { mapGetCoinsRowsToCoinRecords } from "./map-get-coins-row"

const defaultGetCoinsLimit = 30

export type GetCoinsOptions = {
  distributionCode?: string
  engraverCode?: string
  issuerCode?: string
  rulerCode?: string
  themeCode?: string
  titleSearch?: string
  cursor?: { createdAt: Date; id: string }
  limit?: number
}

function buildTitleSearchFilter(titleSearch: string | undefined): SQL | undefined {
  const normalizedTitleSearch = titleSearch?.trim()

  return normalizedTitleSearch
    ? ilike(coin.title, `%${normalizedTitleSearch}%`)
    : undefined
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
        where lower("issuer"."code") = ${normalizedIssuerCode}
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

function buildThemeFilter(themeCode: string | undefined): SQL | undefined {
  const normalizedThemeCode = themeCode?.trim().toLowerCase()

  if (!normalizedThemeCode) {
    return undefined
  }

  return sql`
    exists (
      select 1
      from ${coinTheme}
      inner join ${theme}
        on ${theme.id} = ${coinTheme.themeId}
      where ${coinTheme.coinId} = ${coin.id}
        and lower(${theme.code}) = ${normalizedThemeCode}
    )
  `
}

function buildRulerFilter(rulerCode: string | undefined): SQL | undefined {
  const normalizedRulerCode = rulerCode?.trim().toLowerCase()

  if (!normalizedRulerCode) {
    return undefined
  }

  return sql`
    exists (
      select 1
      from ${coinRuler}
      inner join ${ruler}
        on ${ruler.id} = ${coinRuler.rulerId}
      where ${coinRuler.coinId} = ${coin.id}
        and lower(${ruler.code}) = ${normalizedRulerCode}
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
    rulerCode,
    themeCode,
    titleSearch,
    cursor,
    limit = defaultGetCoinsLimit,
  } = options
  const distributionFilter = buildDistributionFilter(distributionCode)
  const engraverFilter = buildEngraverFilter(engraverCode)
  const issuerFilter = buildIssuerTreeFilter(issuerCode)
  const rulerFilter = buildRulerFilter(rulerCode)
  const themeFilter = buildThemeFilter(themeCode)
  const titleSearchFilter = buildTitleSearchFilter(titleSearch)
  const cursorFilter =
    cursor === undefined
      ? undefined
      : or(
          lt(coin.createdAt, cursor.createdAt),
          and(eq(coin.createdAt, cursor.createdAt), lt(coin.id, cursor.id))
        )
  const filters = [
    distributionFilter,
    engraverFilter,
    issuerFilter,
    rulerFilter,
    themeFilter,
    titleSearchFilter,
    cursorFilter,
  ].filter((filter): filter is SQL => filter !== undefined)
  const limitedCoinsQuery = database
    .select({
      id: coin.id,
      title: coin.title,
      issuerId: coin.issuerId,
      createdAt: coin.createdAt,
    })
    .from(coin)
    .orderBy(desc(coin.createdAt), desc(coin.id))
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
      engraverId: engraver.id,
      engraverCode: engraver.code,
      engraverName: engraver.name,
      issuerId: issuer.id,
      issuerCode: issuer.code,
      issuerIsoCode: issuer.isoCode,
      issuerName: issuer.name,
      createdAt: limitedCoins.createdAt,
      surfaceKind: coinSurface.kind,
      surfaceDescription: coinSurface.description,
      surfaceLettering: coinSurface.lettering,
      surfaceImageUrl: coinSurface.imageUrl,
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
      desc(limitedCoins.id),
      asc(coinSurface.kind),
      asc(engraver.name),
      asc(engraver.code)
    )
}

export async function getCoins(
  options: GetCoinsOptions = {}
): Promise<CoinListRecord[]> {
  return getCoinsWithDatabase(db, options)
}

export async function getCoinsWithDatabase(
  database: typeof db,
  options: GetCoinsOptions = {}
): Promise<CoinListRecord[]> {
  const rows = await buildGetCoinsQuery(database, options)

  return mapGetCoinsRowsToCoinRecords(rows)
}
