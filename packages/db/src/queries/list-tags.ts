import { asc } from "drizzle-orm"

import { tags } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListTags(orm: Database["orm"]) {
  return () => orm.select().from(tags).orderBy(asc(tags.name), asc(tags.slug))
}
