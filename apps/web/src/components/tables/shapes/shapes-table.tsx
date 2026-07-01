import { useState } from "react"
import type { ShapeOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createShapeColumns } from "./columns"
import { ShapeMaintenanceSheet } from "./shape-maintenance-sheet"
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
    getShapeFilterValues(shape).some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

function getShapeFilterValues(shape: ShapeOption): string[] {
  return [shape.code, shape.name]
}

export function ShapesTable({ shapes }: ShapesTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const [selectedShape, setSelectedShape] = useState<ShapeOption | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const filteredShapes = filterShapes(shapes, filterValue)

  function openMaintenanceSheet(shape: ShapeOption | null) {
    setSelectedShape(shape)
    setIsSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={createShapeColumns(openMaintenanceSheet)}
        data={filteredShapes}
        toolbar={() => (
          <ShapesTableToolbar
            filterValue={filterValue}
            onCreateShape={() => openMaintenanceSheet(null)}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <ShapeMaintenanceSheet
        shape={selectedShape}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  )
}
