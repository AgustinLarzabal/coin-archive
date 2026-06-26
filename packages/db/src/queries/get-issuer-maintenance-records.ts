import { alias } from "drizzle-orm/pg-core"
import { asc, eq } from "drizzle-orm"

import { db } from "../client"
import { issuer } from "../schema/issuer"

const parentIssuer = alias(issuer, "parent_issuer")

const getIssuerMaintenanceSelection = {
  id: issuer.id,
  code: issuer.code,
  isoCode: issuer.isoCode,
  name: issuer.name,
  parent: {
    id: parentIssuer.id,
    code: parentIssuer.code,
    name: parentIssuer.name,
  },
}

export type IssuerMaintenanceRecord = {
  id: string
  code: string
  isoCode: string
  name: string
  parent:
    | {
        id: string
        code: string
        name: string
      }
    | null
}

export async function getIssuerMaintenanceRecords(): Promise<
  IssuerMaintenanceRecord[]
> {
  return db
    .select(getIssuerMaintenanceSelection)
    .from(issuer)
    .leftJoin(parentIssuer, eq(issuer.parentIssuerId, parentIssuer.id))
    .orderBy(asc(issuer.name), asc(issuer.code))
}
