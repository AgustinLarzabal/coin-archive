import { asc } from "drizzle-orm"

import { coinTechniques } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListTechniques(orm: Database["orm"]) {
  return () =>
    orm
      .select()
      .from(coinTechniques)
      .orderBy(asc(coinTechniques.name), asc(coinTechniques.slug))
}
