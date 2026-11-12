import { asc } from "drizzle-orm"

import { rulingAuthorities } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListRulingAuthorities(orm: Database["orm"]) {
  return () =>
    orm
      .select()
      .from(rulingAuthorities)
      .orderBy(asc(rulingAuthorities.name), asc(rulingAuthorities.slug))
}
