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

export async function getDatabaseGeneralSummaryCounts(): Promise<DatabaseGeneralSummaryCounts> {
  const [catalogueResult, compositionResult, currencyResult, distributionResult] =
    await Promise.all([
      db.select({ count: count() }).from(catalogue),
      db.select({ count: count() }).from(composition),
      db.select({ count: count() }).from(currency),
      db.select({ count: count() }).from(distribution),
    ])

  return {
    catalogues: catalogueResult.at(0)?.count ?? 0,
    compositions: compositionResult.at(0)?.count ?? 0,
    currencies: currencyResult.at(0)?.count ?? 0,
    distributions: distributionResult.at(0)?.count ?? 0,
  }
}
