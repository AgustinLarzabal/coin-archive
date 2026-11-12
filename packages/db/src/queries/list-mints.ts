import { asc, eq } from "drizzle-orm"

import { issuers, mints } from "../schema/index.js"
import type { Database } from "../connection.js"

export function createListMints(orm: Database["orm"]) {
  return async () =>
    (
      await orm
        .select({ mint: mints, country: issuers })
        .from(mints)
        .innerJoin(issuers, eq(mints.countryId, issuers.id))
        .orderBy(asc(mints.name), asc(mints.slug))
    ).map(({ mint, country }) => ({ ...mint, country }))
}
