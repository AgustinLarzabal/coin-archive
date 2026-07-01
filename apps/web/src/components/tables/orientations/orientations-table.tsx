import { useState } from "react"
import type { OrientationOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { orientationColumns } from "./columns"
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
  const [filterValue, setFilterValue] = useState("")
  const filteredOrientations = filterOrientations(orientations, filterValue)

  return (
    <DataTable
      columns={orientationColumns}
      data={filteredOrientations}
      toolbar={() => (
        <OrientationsTableToolbar
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
        />
      )}
    />
  )
}
