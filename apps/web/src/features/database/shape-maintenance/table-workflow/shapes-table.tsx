import { useState } from "react"
import type { ShapeOption } from "@coin-archive/db"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createShapeColumns } from "./columns"
import { ShapeMaintenanceSheet } from "../sheet-workflow/shape-maintenance-sheet"
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
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const filteredShapes = filterShapes(shapes, filterValue)

  function openMaintenanceSheet(shape: ShapeOption | null) {
    setSelectedShape(shape)
    setIsMaintenanceSheetOpen(true)
  }

  function openCreateShapeSheet() {
    openMaintenanceSheet(null)
  }

  function openEditShapeSheet(shape: ShapeOption) {
    openMaintenanceSheet(shape)
  }

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)
  }

  return (
    <>
      <DataTable
        columns={createShapeColumns(openEditShapeSheet)}
        data={filteredShapes}
        toolbar={() => (
          <ShapesTableToolbar
            filterValue={filterValue}
            onCreateShape={openCreateShapeSheet}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <ShapeMaintenanceSheet
        shape={selectedShape}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
