import type { Issuer, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type IssuerMaintenancePageLoaderData = MaintenancePageLoaderData<{
  issuers: IssuerMaintenanceRecord[]
}>

export type IssuerMaintenanceRecord = Pick<
  Issuer,
  "id" | "code" | "isoCode" | "name" | "etag"
> & {
  parent: Pick<Issuer, "id" | "code" | "name"> | null
}

export type IssuerMaintenanceReadDependencies = {
  listIssuers: MaintenanceApiClient["issuers"]["list"]
}
export function toIssuerMaintenanceRecords(
  issuers: Issuer[]
): IssuerMaintenanceRecord[] {
  const issuersById = new Map(issuers.map((issuer) => [issuer.id, issuer]))

  return issuers.map((issuer) => {
    const parent =
      issuer.parentIssuerId === null
        ? undefined
        : issuersById.get(issuer.parentIssuerId)

    return {
      id: issuer.id,
      code: issuer.code,
      isoCode: issuer.isoCode,
      name: issuer.name,
      etag: issuer.etag,
      parent: parent
        ? { id: parent.id, code: parent.code, name: parent.name }
        : null,
    }
  })
}
