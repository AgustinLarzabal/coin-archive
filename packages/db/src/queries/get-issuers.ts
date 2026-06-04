import { asc } from "drizzle-orm"

import { db } from "../client"
import { issuer } from "../schema/issuer"
import type { Issuer } from "../schema/issuer"

const getIssuersSelection = {
  code: issuer.code,
  name: issuer.name,
}

export type IssuerOption = Pick<Issuer, "code" | "name">

export async function getIssuers() {
  return db
    .select(getIssuersSelection)
    .from(issuer)
    .orderBy(asc(issuer.name), asc(issuer.code))
}
