import { asc } from "drizzle-orm"

import { issuers } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListIssuers(orm: Database["orm"]) {
  return () =>
    orm.select().from(issuers).orderBy(asc(issuers.name), asc(issuers.code))
}
