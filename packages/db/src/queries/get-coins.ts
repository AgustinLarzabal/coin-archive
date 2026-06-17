import { desc, eq, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import { db } from "../client"
import { coin } from "../schema/coin"
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
  const baseQuery = database
    .select({
      id: coin.id,
      title: coin.title,
      issuerId: issuer.id,
      issuerCode: issuer.code,
      issuerName: issuer.name,
      issuerIsoCode: issuer.isoCode,
    })
    .from(coin)
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .orderBy(desc(coin.createdAt))
    .limit(limit)

  return issuerFilter ? baseQuery.where(issuerFilter) : baseQuery
}

export async function getCoins(
  options: GetCoinsOptions = {}
): Promise<CoinListRecord[]> {
  const rows = await buildGetCoinsQuery(db, options)

  return mapGetCoinsRowsToCoinRecords(rows)
}
