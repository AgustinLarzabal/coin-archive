import { useMemo, useState } from "react"
import type { EdgeOption } from "@coin-archive/db"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createEdgeColumns } from "./columns"
import { EdgeMaintenanceSheet } from "../sheet-workflow/edge-maintenance-sheet"
import { EdgesTableToolbar } from "./edges-table-toolbar"

type EdgesTableProps = {
  edges: EdgeOption[]
}

export function filterEdges(edges: EdgeOption[], filterValue: string): EdgeOption[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return edges
  }

  return edges.filter((edge) =>
    [edge.code, edge.name].some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

export function EdgesTable({ edges }: EdgesTableProps) {
  const [selectedEdge, setSelectedEdge] = useState<EdgeOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [filterValue, setFilterValue] = useState("")
  const columns = useMemo(
    () =>
      createEdgeColumns((edge) => {
        setSelectedEdge(edge)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredEdges = filterEdges(edges, filterValue)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedEdge(null)
    }
  }

  function handleCreateEdge() {
    setSelectedEdge(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredEdges}
        toolbar={() => (
          <EdgesTableToolbar
            filterValue={filterValue}
            onCreateEdge={handleCreateEdge}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <EdgeMaintenanceSheet
        edge={selectedEdge}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
