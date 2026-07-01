import { useMemo, useState } from "react"
import type { OrientationOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createOrientationColumns } from "./columns"
import { OrientationMaintenanceSheet } from "./orientation-maintenance-sheet"
import { OrientationsTableToolbar } from "./orientations-table-toolbar"

type OrientationsTableProps = {
  orientations: OrientationOption[]
}

export function filterOrientations(
  orientations: OrientationOption[],
  filterValue: string
): OrientationOption[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return orientations
  }

  return orientations.filter((orientation) =>
    getOrientationFilterValues(orientation).some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

function getOrientationFilterValues(
  orientation: OrientationOption
): string[] {
  return [orientation.code, orientation.name]
}

export function OrientationsTable({
  orientations,
}: OrientationsTableProps) {
  const [selectedOrientation, setSelectedOrientation] =
    useState<OrientationOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [filterValue, setFilterValue] = useState("")
  const columns = useMemo(
    () =>
      createOrientationColumns((orientation) => {
        setSelectedOrientation(orientation)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredOrientations = filterOrientations(orientations, filterValue)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedOrientation(null)
    }
  }

  function handleCreateOrientation() {
    setSelectedOrientation(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredOrientations}
        toolbar={() => (
          <OrientationsTableToolbar
            filterValue={filterValue}
            onCreateOrientation={handleCreateOrientation}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <OrientationMaintenanceSheet
        orientation={selectedOrientation}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
