import { useMemo, useState } from "react"
import type { Shape } from "@coin-archive/api"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createShapeColumns } from "./columns"
import { ShapeMaintenanceSheet } from "../sheet-workflow/shape-maintenance-sheet"
import { ShapesTableToolbar } from "./shapes-table-toolbar"

type ShapesTableProps = {
  shapes: Shape[]
}

export function filterShapes(shapes: Shape[], filterValue: string): Shape[] {
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
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [filterValue, setFilterValue] = useState("")
  const columns = useMemo(
    () =>
      createShapeColumns((shape) => {
        setSelectedShape(shape)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredShapes = filterShapes(shapes, filterValue)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedShape(null)
    }
  }

  function handleCreateShape() {
    setSelectedShape(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredShapes}
        toolbar={() => (
          <ShapesTableToolbar
            filterValue={filterValue}
            onCreateShape={handleCreateShape}
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
