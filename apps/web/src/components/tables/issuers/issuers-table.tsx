import { useMemo, useState } from "react"
import type { IssuerMaintenanceRecord } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createIssuerColumns } from "./columns"
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
  const [selectedIssuer, setSelectedIssuer] =
    useState<IssuerMaintenanceRecord | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [filterValue, setFilterValue] = useState("")
  const columns = useMemo(
    () =>
      createIssuerColumns((issuer) => {
        setSelectedIssuer(issuer)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredIssuers = filterIssuers(issuers, filterValue)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedIssuer(null)
    }
  }

  function handleCreateIssuer() {
    setSelectedIssuer(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredIssuers}
        toolbar={() => (
          <IssuersTableToolbar
            filterValue={filterValue}
            onCreateIssuer={handleCreateIssuer}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <IssuerMaintenanceSheet
        issuer={selectedIssuer}
        issuers={issuers}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
