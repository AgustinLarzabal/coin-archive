import { useMemo, useState } from "react"
import type { Rim } from "@coin-archive/api"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createRimColumns } from "./columns"
import { RimMaintenanceSheet } from "../sheet-workflow/rim-maintenance-sheet"
import { RimsTableToolbar } from "./rims-table-toolbar"

type RimsTableProps = {
  rims: Rim[]
}

export function filterRims(rims: Rim[], filterValue: string): Rim[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return rims
  }

  return rims.filter((rim) =>
    [rim.code, rim.name].some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

export function RimsTable({ rims }: RimsTableProps) {
  const [selectedRim, setSelectedRim] = useState<Rim | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [filterValue, setFilterValue] = useState("")
  const columns = useMemo(
    () =>
      createRimColumns((rim) => {
        setSelectedRim(rim)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredRims = filterRims(rims, filterValue)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedRim(null)
    }
  }

  function handleCreateRim() {
    setSelectedRim(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
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
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
