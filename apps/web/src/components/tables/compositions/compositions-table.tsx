import { useMemo, useState } from "react"
import type { CompositionOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createCompositionColumns } from "./columns"
import { CompositionMaintenanceSheet } from "./composition-maintenance-sheet"
import { CompositionsTableToolbar } from "./compositions-table-toolbar"

type CompositionsTableProps = {
  compositions: CompositionOption[]
}

export function filterCompositionsByName(
  compositions: CompositionOption[],
  nameFilter: string
): CompositionOption[] {
  const normalizedNameFilter = nameFilter.trim().toLocaleLowerCase()

  if (normalizedNameFilter === "") {
    return compositions
  }

  return compositions.filter((composition) =>
    composition.name.toLocaleLowerCase().includes(normalizedNameFilter)
  )
}

export function CompositionsTable({ compositions }: CompositionsTableProps) {
  const [selectedComposition, setSelectedComposition] =
    useState<CompositionOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [nameFilter, setNameFilter] = useState("")
  const columns = useMemo(
    () =>
      createCompositionColumns((composition) => {
        setSelectedComposition(composition)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredCompositions = filterCompositionsByName(
    compositions,
    nameFilter
  )

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedComposition(null)
    }
  }

  function handleCreateComposition() {
    setSelectedComposition(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredCompositions}
        toolbar={() => (
          <CompositionsTableToolbar
            nameFilter={nameFilter}
            onCreateComposition={handleCreateComposition}
            onNameFilterChange={setNameFilter}
          />
        )}
      />
      <CompositionMaintenanceSheet
        composition={selectedComposition}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
