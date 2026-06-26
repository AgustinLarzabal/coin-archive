import { count } from "drizzle-orm"

import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import { composition } from "../schema/composition"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"

export type DatabaseGeneralSummaryCounts = {
  catalogues: number
  compositions: number
  currencies: number
  distributions: number
}

async function getCount(
  query: Promise<Array<{ count: number }>>
): Promise<number> {
  return (await query).at(0)?.count ?? 0
}

export async function getDatabaseGeneralSummaryCounts(): Promise<DatabaseGeneralSummaryCounts> {
  const [catalogues, compositions, currencies, distributions] =
    await Promise.all([
      getCount(db.select({ count: count() }).from(catalogue)),
      getCount(db.select({ count: count() }).from(composition)),
      getCount(db.select({ count: count() }).from(currency)),
      getCount(db.select({ count: count() }).from(distribution)),
    ])

  return {
    catalogues,
    compositions,
    currencies,
    distributions,
  }
}
