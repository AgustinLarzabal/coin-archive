import { useState } from "react"
import type { RimOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createRimColumns } from "./columns"
import { RimMaintenanceSheet } from "./rim-maintenance-sheet"
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
  const [selectedRim, setSelectedRim] = useState<RimOption | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const filteredRims = filterRims(rims, filterValue)

  function handleCreateRim() {
    setSelectedRim(null)
    setIsSheetOpen(true)
  }

  function handleEditRim(rim: RimOption) {
    setSelectedRim(rim)
    setIsSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={createRimColumns(handleEditRim)}
        data={filteredRims}
        toolbar={() => (
          <RimsTableToolbar
            filterValue={filterValue}
            onCreateRim={handleCreateRim}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <RimMaintenanceSheet
        rim={selectedRim}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  )
}
