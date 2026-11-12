import { asc } from "drizzle-orm"

import { coinShapes } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListShapes(orm: Database["orm"]) {
  return () =>
    orm
      .select()
      .from(coinShapes)
      .orderBy(asc(coinShapes.name), asc(coinShapes.slug))
}
