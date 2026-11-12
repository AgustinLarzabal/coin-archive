import { asc } from "drizzle-orm"

import { coinOrientations } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListOrientations(orm: Database["orm"]) {
  return () =>
    orm
      .select()
      .from(coinOrientations)
      .orderBy(asc(coinOrientations.name), asc(coinOrientations.slug))
}
