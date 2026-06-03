import { desc, eq, sql, type SQL } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "../client"
import { coin } from "../schema/coin"
import { issuer } from "../schema/issuer"
import { mapGetCoinsRowToCoinRecord } from "./map-get-coins-row"

const defaultGetCoinsLimit = 10
const parentIssuer = alias(issuer, "parent_issuer")
const getCoinsSelection = {
  id: coin.id,
  title: coin.title,
  createdAt: coin.createdAt,
  updatedAt: coin.updatedAt,
  issuerCode: issuer.code,
  issuerName: issuer.name,
  parentIssuerCode: parentIssuer.code,
  parentIssuerName: parentIssuer.name,
}

export type GetCoinsOptions = {
  limit?: number
  issuerCode?: string
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

export function buildGetCoinsQuery(
  database: typeof db,
  options: GetCoinsOptions = {}
) {
  const { limit = defaultGetCoinsLimit, issuerCode } = options

  const query = database
    .select(getCoinsSelection)
    .from(coin)
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .leftJoin(parentIssuer, eq(issuer.parentIssuerId, parentIssuer.id))
    .orderBy(desc(coin.createdAt), desc(coin.id))

  if (issuerCode !== undefined) {
    return query.where(buildIssuerTreeFilter(issuerCode)).limit(limit)
  }

  return query.limit(limit)
}

export async function getCoins(options: GetCoinsOptions = {}) {
  const coins = await buildGetCoinsQuery(db, options)

  return coins.map(mapGetCoinsRowToCoinRecord)
}
