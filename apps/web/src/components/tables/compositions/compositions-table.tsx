import { useState } from "react"
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
  const [activeComposition, setActiveComposition] =
    useState<CompositionOption | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const filteredCompositions = filterCompositionsByName(
    compositions,
    nameFilter
  )
  const compositionColumns = createCompositionColumns((composition) => {
    setActiveComposition(composition)
    setIsSheetOpen(true)
  })

  return (
    <>
      <DataTable
        columns={compositionColumns}
        data={filteredCompositions}
        toolbar={() => (
          <CompositionsTableToolbar
            nameFilter={nameFilter}
            onCreateComposition={() => {
              setActiveComposition(null)
              setIsSheetOpen(true)
            }}
            onNameFilterChange={setNameFilter}
          />
        )}
      />
      <CompositionEditSheet
        composition={activeComposition}
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open)

          if (!open) {
            setActiveComposition(null)
          }
        }}
      />
    </>
  )
}
