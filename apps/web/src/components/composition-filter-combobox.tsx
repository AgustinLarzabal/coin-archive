import type { CompositionOption } from "@workspace/db"
import { getCompositionOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type CompositionFilterComboboxProps = {
  compositions: CompositionOption[]
  onValueChange: (composition: CompositionOption | null) => Promise<void>
  selectedComposition: CompositionOption | null
}

export function CompositionFilterCombobox({
  compositions,
  onValueChange,
  selectedComposition,
}: CompositionFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<CompositionOption>
      emptyMessage="No compositions found."
      items={compositions}
      itemToStringLabel={getCompositionOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by composition"
      showCode={false}
      selectedItem={selectedComposition}
    />
  )
}
