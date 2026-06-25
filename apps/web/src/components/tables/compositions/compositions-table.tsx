import { useState } from "react"
import type { CompositionOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { compositionColumns } from "./columns"
import { CompositionsTableToolbar } from "./compositions-table-toolbar"

type CompositionsTableProps = {
  compositions: CompositionOption[]
}

export function filterCompositionsByName(
  compositions: CompositionOption[],
  nameFilter: string
): CompositionOption[] {
  const normalizedNameFilter = nameFilter.trim().toLocaleLowerCase()

  if (normalizedNameFilter.length === 0) {
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
  const filteredCompositions = filterCompositionsByName(
    compositions,
    nameFilter
  )

  return (
    <DataTable
      columns={compositionColumns}
      data={filteredCompositions}
      toolbar={() => (
        <CompositionsTableToolbar
          nameFilter={nameFilter}
          onNameFilterChange={setNameFilter}
        />
      )}
    />
  )
}
