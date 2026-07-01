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
  const [shouldOpenDeleteDialog, setShouldOpenDeleteDialog] = useState(false)
  const [filterValue, setFilterValue] = useState("")

  function openMaintenanceSheet(
    issuer: IssuerMaintenanceRecord | null,
    options?: { deleteDialogOpen?: boolean }
  ) {
    setSelectedIssuer(issuer)
    setShouldOpenDeleteDialog(options?.deleteDialogOpen ?? false)
    setIsMaintenanceSheetOpen(true)
  }

  const columns = useMemo(
    () =>
      createIssuerColumns(
        (issuer) => {
          openMaintenanceSheet(issuer)
        },
        (issuer) => {
          openMaintenanceSheet(issuer, { deleteDialogOpen: true })
        }
      ),
    []
  )
  const filteredIssuers = filterIssuers(issuers, filterValue)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedIssuer(null)
      setShouldOpenDeleteDialog(false)
    }
  }

  function handleCreateIssuer() {
    openMaintenanceSheet(null)
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
        initialDeleteDialogOpen={shouldOpenDeleteDialog}
        issuers={issuers}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
