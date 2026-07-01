import { count } from "drizzle-orm"

import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import { composition } from "../schema/composition"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"
import { edge } from "../schema/edge"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import { mint } from "../schema/mint"
import { orientation } from "../schema/orientation"
import { rim } from "../schema/rim"

export type DatabaseGeneralSummaryCounts = {
  catalogues: number
  compositions: number
  currencies: number
  distributions: number
  edges: number
  rims: number
  engravers: number
  issuers: number
  orientations: number
  mints: number
}

async function getCount(
  query: Promise<Array<{ count: number }>>
): Promise<number> {
  return (await query).at(0)?.count ?? 0
}

export async function getDatabaseGeneralSummaryCounts(): Promise<DatabaseGeneralSummaryCounts> {
  const [
    catalogues,
    compositions,
    currencies,
    distributions,
    edges,
    rims,
    engravers,
    issuers,
    orientations,
    mints,
  ] = await Promise.all([
      getCount(db.select({ count: count() }).from(catalogue)),
      getCount(db.select({ count: count() }).from(composition)),
      getCount(db.select({ count: count() }).from(currency)),
      getCount(db.select({ count: count() }).from(distribution)),
      getCount(db.select({ count: count() }).from(edge)),
      getCount(db.select({ count: count() }).from(rim)),
      getCount(db.select({ count: count() }).from(engraver)),
      getCount(db.select({ count: count() }).from(issuer)),
      getCount(db.select({ count: count() }).from(orientation)),
      getCount(db.select({ count: count() }).from(mint)),
    ])

  return {
    catalogues,
    compositions,
    currencies,
    distributions,
    edges,
    rims,
    engravers,
    issuers,
    orientations,
    mints,
  }
}
