import { useState } from "react"
import type { IssuerMaintenanceRecord } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { issuerColumns } from "./columns"
import { IssuerMaintenanceSheet } from "./issuer-maintenance-sheet"
import { IssuersTableToolbar } from "./issuers-table-toolbar"

type IssuersTableProps = {
  issuers: IssuerMaintenanceRecord[]
}

export function filterIssuers(
  issuers: IssuerMaintenanceRecord[],
  filterValue: string
): IssuerMaintenanceRecord[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return issuers
  }

  return issuers.filter((issuer) =>
    getIssuerFilterValues(issuer).some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

function getIssuerFilterValues(issuer: IssuerMaintenanceRecord): string[] {
  return [issuer.name, issuer.code, issuer.isoCode, issuer.parent?.name ?? ""]
}

export function IssuersTable({ issuers }: IssuersTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const filteredIssuers = filterIssuers(issuers, filterValue)

  return (
    <>
      <DataTable
        columns={issuerColumns}
        data={filteredIssuers}
        toolbar={() => (
          <IssuersTableToolbar
            filterValue={filterValue}
            onFilterValueChange={setFilterValue}
            onCreateIssuer={() => setIsMaintenanceSheetOpen(true)}
          />
        )}
      />
      <IssuerMaintenanceSheet
        issuers={issuers}
        open={isMaintenanceSheetOpen}
        onOpenChange={setIsMaintenanceSheetOpen}
      />
    </>
  )
}
