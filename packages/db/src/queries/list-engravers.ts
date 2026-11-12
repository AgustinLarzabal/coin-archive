import { asc } from "drizzle-orm"

import { engravers } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListEngravers(orm: Database["orm"]) {
  return () =>
    orm
      .select()
      .from(engravers)
      .orderBy(asc(engravers.fullName), asc(engravers.slug))
}
