import type { EdgeOption } from "@workspace/db"
import { getEdgeOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type EdgeFilterComboboxProps = {
  onValueChange: (edge: EdgeOption | null) => Promise<void>
  selectedEdge: EdgeOption | null
  edges: EdgeOption[]
}

export function EdgeFilterCombobox({
  onValueChange,
  selectedEdge,
  edges,
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
