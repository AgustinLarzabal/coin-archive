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
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import { shape } from "../schema/shape"

export type DatabaseGeneralSummaryCounts = {
  catalogues: number
  compositions: number
  currencies: number
  distributions: number
  edges: number
  rims: number
  shapes: number
  engravers: number
  issuers: number
  rulers: number
  rulerGroups: number
  orientations: number
  mints: number
}

const DATABASE_GENERAL_SUMMARY_COUNT_QUERIES = {
  catalogues: () => db.select({ count: count() }).from(catalogue),
  compositions: () => db.select({ count: count() }).from(composition),
  currencies: () => db.select({ count: count() }).from(currency),
  distributions: () => db.select({ count: count() }).from(distribution),
  edges: () => db.select({ count: count() }).from(edge),
  rims: () => db.select({ count: count() }).from(rim),
  shapes: () => db.select({ count: count() }).from(shape),
  engravers: () => db.select({ count: count() }).from(engraver),
  issuers: () => db.select({ count: count() }).from(issuer),
  rulers: () => db.select({ count: count() }).from(ruler),
  rulerGroups: () => db.select({ count: count() }).from(rulerGroup),
  orientations: () => db.select({ count: count() }).from(orientation),
  mints: () => db.select({ count: count() }).from(mint),
} satisfies Record<
  keyof DatabaseGeneralSummaryCounts,
  () => Promise<Array<{ count: number }>>
>

async function getCount(
  query: Promise<Array<{ count: number }>>
): Promise<number> {
  return (await query).at(0)?.count ?? 0
}

export async function getDatabaseGeneralSummaryCounts(): Promise<DatabaseGeneralSummaryCounts> {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(DATABASE_GENERAL_SUMMARY_COUNT_QUERIES).map(
        async ([key, createQuery]) => [key, await getCount(createQuery())] as const
      )
    )
  ) as DatabaseGeneralSummaryCounts
}
