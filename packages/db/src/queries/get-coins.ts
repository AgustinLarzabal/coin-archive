import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "../client"
import { coin } from "../schema/coin"
import { coinRuler } from "../schema/coin-ruler"
import { issuer } from "../schema/issuer"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import { mapGetCoinsRowsToCoinRecords } from "./map-get-coins-row"

const defaultGetCoinsLimit = 10
const parentIssuer = alias(issuer, "parent_issuer")
const getCoinsSelection = {
  id: coin.id,
  title: coin.title,
  createdAt: coin.createdAt,
  updatedAt: coin.updatedAt,
  issuerId: issuer.id,
  issuerCode: issuer.code,
  issuerName: issuer.name,
  issuerCreatedAt: issuer.createdAt,
  issuerUpdatedAt: issuer.updatedAt,
  parentIssuerId: parentIssuer.id,
  parentIssuerCode: parentIssuer.code,
  parentIssuerName: parentIssuer.name,
  parentIssuerCreatedAt: parentIssuer.createdAt,
  parentIssuerUpdatedAt: parentIssuer.updatedAt,
  rulerId: ruler.id,
  rulerCode: ruler.code,
  rulerName: ruler.name,
  rulerCreatedAt: ruler.createdAt,
  rulerUpdatedAt: ruler.updatedAt,
  rulerGroupId: rulerGroup.id,
  rulerGroupCode: rulerGroup.code,
  rulerGroupName: rulerGroup.name,
  rulerGroupCreatedAt: rulerGroup.createdAt,
  rulerGroupUpdatedAt: rulerGroup.updatedAt,
}

export type GetCoinsOptions = {
  limit?: number
  issuerCode?: string
  rulerCode?: string
}

type CoinFilterOptions = Pick<GetCoinsOptions, "issuerCode" | "rulerCode">

function buildCoinFilter({
  issuerCode,
  rulerCode,
}: CoinFilterOptions): SQL | undefined {
  const issuerFilter =
    issuerCode === undefined ? undefined : buildIssuerTreeFilter(issuerCode)
  const rulerFilter =
    rulerCode === undefined ? undefined : buildRulerFilter(rulerCode)

  if (issuerFilter !== undefined && rulerFilter !== undefined) {
    return and(issuerFilter, rulerFilter)
  }

  return issuerFilter ?? rulerFilter
}

function buildLimitedCoinsQuery(
  database: typeof db,
  { limit, issuerCode, rulerCode }: { limit: number } & CoinFilterOptions
) {
  const filter = buildCoinFilter({ issuerCode, rulerCode })

  const baseQuery = database
    .select({
      id: coin.id,
    })
    .from(coin)
    .orderBy(desc(coin.createdAt), desc(coin.id))
    .limit(limit)

  if (filter === undefined) {
    return baseQuery.as("limited_coins")
  }

  return baseQuery.where(filter).as("limited_coins")
}

function buildIssuerTreeFilter(issuerCode: string): SQL {
  return sql`
    ${coin.issuerId} in (
      with recursive issuer_tree(id) as (
        select "issuer"."id"
        from "issuer"
        where "issuer"."code" = ${issuerCode}
        union all
        select "child_issuer"."id"
        from "issuer" as "child_issuer"
        inner join issuer_tree on "child_issuer"."parent_issuer_id" = issuer_tree.id
      )
      select issuer_tree.id
      from issuer_tree
    )
  `
}

function buildRulerFilter(rulerCode: string): SQL {
  return sql`
    ${coin.id} in (
      select "coin_ruler"."coin_id"
      from "coin_ruler"
      inner join "ruler" on "coin_ruler"."ruler_id" = "ruler"."id"
      where "ruler"."code" = ${rulerCode}
    )
  `
}

export function buildGetCoinsQuery(
  database: typeof db,
  options: GetCoinsOptions = {}
) {
  const { limit = defaultGetCoinsLimit, issuerCode, rulerCode } = options

  const limitedCoins = buildLimitedCoinsQuery(database, {
    limit,
    issuerCode,
    rulerCode,
  })

  return database
    .select(getCoinsSelection)
    .from(limitedCoins)
    .innerJoin(coin, eq(limitedCoins.id, coin.id))
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .leftJoin(parentIssuer, eq(issuer.parentIssuerId, parentIssuer.id))
    .leftJoin(coinRuler, eq(coin.id, coinRuler.coinId))
    .leftJoin(ruler, eq(coinRuler.rulerId, ruler.id))
    .leftJoin(rulerGroup, eq(ruler.rulerGroupId, rulerGroup.id))
    .orderBy(
      desc(coin.createdAt),
      desc(coin.id),
      asc(coinRuler.rulerOrder),
      asc(ruler.id)
    )
}

export async function getCoins(options: GetCoinsOptions = {}) {
  const rows = await buildGetCoinsQuery(db, options)

  return mapGetCoinsRowsToCoinRecords(rows)
}
