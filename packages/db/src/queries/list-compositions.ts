import { asc } from "drizzle-orm"

import { compositions } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListCompositions(orm: Database["orm"]) {
  return () =>
    orm
      .select()
      .from(compositions)
      .orderBy(asc(compositions.name), asc(compositions.slug))
}
