import type { ShapeOption } from "@workspace/db"
import { getShapeOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type ShapeFilterComboboxProps = {
  onValueChange: (shape: ShapeOption | null) => Promise<void>
  selectedShape: ShapeOption | null
  shapes: ShapeOption[]
}

export function ShapeFilterCombobox({
  onValueChange,
  selectedShape,
  shapes,
}: ShapeFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<ShapeOption>
      emptyMessage="No shapes found."
      items={shapes}
      itemToStringLabel={getShapeOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by shape"
      selectedItem={selectedShape}
    />
  )
}
