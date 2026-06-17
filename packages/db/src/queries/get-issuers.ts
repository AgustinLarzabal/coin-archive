import { asc } from "drizzle-orm"

import { db } from "../client"
import { issuer } from "../schema/issuer"
import type { Issuer } from "../schema/issuer"

const getIssuersSelection = {
  id: issuer.id,
  code: issuer.code,
  isoCode: issuer.isoCode,
  name: issuer.name,
}

export type IssuerOption = Pick<Issuer, "id" | "code" | "isoCode" | "name">

export async function getIssuers(): Promise<IssuerOption[]> {
  return db
    .select(getIssuersSelection)
    .from(issuer)
    .orderBy(asc(issuer.name), asc(issuer.code))
}
