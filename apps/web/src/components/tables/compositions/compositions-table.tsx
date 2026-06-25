import { useMemo, useState } from "react"
import type { CompositionOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createCompositionColumns } from "./columns"
import { CompositionEditSheet } from "./composition-edit-sheet"
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

export function CompositionsTable({
  compositions,
}: CompositionsTableProps) {
  const [nameFilter, setNameFilter] = useState("")
  const [editingComposition, setEditingComposition] =
    useState<CompositionOption | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const filteredCompositions = filterCompositionsByName(
    compositions,
    nameFilter
  )
  const columns = useMemo(
    () =>
      createCompositionColumns((composition) => {
        setEditingComposition(composition)
        setIsEditSheetOpen(true)
      }),
    []
  )

  function handleEditSheetOpenChange(open: boolean) {
    setIsEditSheetOpen(open)

    if (!open) {
      setEditingComposition(null)
    }
  }

  function handleCreateComposition() {
    setEditingComposition(null)
    setIsEditSheetOpen(true)
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
      <CompositionEditSheet
        composition={editingComposition}
        open={isEditSheetOpen}
        onOpenChange={handleEditSheetOpenChange}
      />
    </>
  )
}
