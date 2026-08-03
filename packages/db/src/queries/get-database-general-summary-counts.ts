import { count } from "drizzle-orm"

import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { composition } from "../schema/composition"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"
import { edge } from "../schema/edge"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import { mint } from "../schema/mint"
import { orientation } from "../schema/orientation"
import { rim } from "../schema/rim"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import { shape } from "../schema/shape"
import { technique } from "../schema/technique"
import { theme } from "../schema/theme"

export type DatabaseGeneralSummaryCounts = {
  coins: number
  catalogues: number
  compositions: number
  currencies: number
  distributions: number
  edges: number
  rims: number
  shapes: number
  mintingTechniques: number
  engravers: number
  themes: number
  issuers: number
  rulers: number
  rulerGroups: number
  orientations: number
  mints: number
}

function createDatabaseGeneralSummaryCountQueries(database: typeof db) {
  return {
    coins: () => database.select({ count: count() }).from(coin),
    catalogues: () => database.select({ count: count() }).from(catalogue),
    compositions: () => database.select({ count: count() }).from(composition),
    currencies: () => database.select({ count: count() }).from(currency),
    distributions: () => database.select({ count: count() }).from(distribution),
    edges: () => database.select({ count: count() }).from(edge),
    rims: () => database.select({ count: count() }).from(rim),
    shapes: () => database.select({ count: count() }).from(shape),
    mintingTechniques: () =>
      database.select({ count: count() }).from(technique),
    engravers: () => database.select({ count: count() }).from(engraver),
    themes: () => database.select({ count: count() }).from(theme),
    issuers: () => database.select({ count: count() }).from(issuer),
    rulers: () => database.select({ count: count() }).from(ruler),
    rulerGroups: () => database.select({ count: count() }).from(rulerGroup),
    orientations: () => database.select({ count: count() }).from(orientation),
    mints: () => database.select({ count: count() }).from(mint),
  } satisfies Record<
    keyof DatabaseGeneralSummaryCounts,
    () => Promise<Array<{ count: number }>>
  >
}

async function getCount(
  query: Promise<Array<{ count: number }>>
): Promise<number> {
  return (await query).at(0)?.count ?? 0
}

export async function getDatabaseGeneralSummaryCounts(): Promise<DatabaseGeneralSummaryCounts> {
  return getDatabaseGeneralSummaryCountsWithDatabase(db)
}

export async function getDatabaseGeneralSummaryCountsWithDatabase(
  database: typeof db
): Promise<DatabaseGeneralSummaryCounts> {
  const queries = createDatabaseGeneralSummaryCountQueries(database)
  return Object.fromEntries(
    await Promise.all(
      Object.entries(queries).map(
        async ([key, createQuery]) =>
          [key, await getCount(createQuery())] as const
      )
    )
  ) as DatabaseGeneralSummaryCounts
}
