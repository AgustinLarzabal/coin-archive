import { asc, sql } from "drizzle-orm"

import { currencies } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListCurrencies(orm: Database["orm"]) {
  return () =>
    orm
      .select()
      .from(currencies)
      .orderBy(
        asc(sql`${currencies.name} || ' (' || ${currencies.periodLabel} || ')'`)
      )
}
