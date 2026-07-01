import { useState } from "react"
import type { RimOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { rimColumns } from "./columns"
import { RimsTableToolbar } from "./rims-table-toolbar"

type RimsTableProps = {
  rims: RimOption[]
}

export function filterRims(rims: RimOption[], filterValue: string): RimOption[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return rims
  }

  return rims.filter((rim) =>
    getRimFilterValues(rim).some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

function getRimFilterValues(rim: RimOption): string[] {
  return [rim.code, rim.name]
}

export function RimsTable({ rims }: RimsTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const filteredRims = filterRims(rims, filterValue)

  return (
    <DataTable
      columns={rimColumns}
      data={filteredRims}
      toolbar={() => (
        <RimsTableToolbar
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
        />
      )}
    />
  )
}
