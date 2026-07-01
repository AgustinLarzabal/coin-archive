import { useState } from "react"
import type { ShapeOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { shapeColumns } from "./columns"
import { ShapesTableToolbar } from "./shapes-table-toolbar"

type ShapesTableProps = {
  shapes: ShapeOption[]
}

export function filterShapes(
  shapes: ShapeOption[],
  filterValue: string
): ShapeOption[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return shapes
  }

  return shapes.filter((shape) =>
    [shape.code, shape.name].some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

export function ShapesTable({ shapes }: ShapesTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const filteredShapes = filterShapes(shapes, filterValue)

  return (
    <DataTable
      columns={shapeColumns}
      data={filteredShapes}
      toolbar={() => (
        <ShapesTableToolbar
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
        />
      )}
    />
  )
}
