import type { EdgeOption } from "@workspace/db"
import { getEdgeOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type EdgeFilterComboboxProps = {
  edges: EdgeOption[]
  onValueChange: (edge: EdgeOption | null) => Promise<void>
  selectedEdge: EdgeOption | null
}

export function EdgeFilterCombobox({
  edges,
  onValueChange,
  selectedEdge,
}: EdgeFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<EdgeOption>
      emptyMessage="No edges found."
      items={edges}
      itemToStringLabel={getEdgeOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by edge"
      selectedItem={selectedEdge}
    />
  )
}
