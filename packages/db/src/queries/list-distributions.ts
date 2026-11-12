import { asc } from "drizzle-orm"

import { distributions } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListDistributions(orm: Database["orm"]) {
  return () =>
    orm
      .select()
      .from(distributions)
      .orderBy(asc(distributions.name), asc(distributions.slug))
}
