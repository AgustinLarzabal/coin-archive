import { useMemo, useState } from "react"
import type { IssuerMaintenanceRecord } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createIssuerColumns } from "./columns"
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
    [
      issuer.name,
      issuer.code,
      issuer.isoCode,
      issuer.parent?.name ?? "",
    ].some((value) => value.toLocaleLowerCase().includes(normalizedFilterValue))
  )
}

export function IssuersTable({ issuers }: IssuersTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const columns = useMemo(() => createIssuerColumns(), [])
  const filteredIssuers = filterIssuers(issuers, filterValue)

  return (
    <DataTable
      columns={columns}
      data={filteredIssuers}
      toolbar={() => (
        <IssuersTableToolbar
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
        />
      )}
    />
  )
}
