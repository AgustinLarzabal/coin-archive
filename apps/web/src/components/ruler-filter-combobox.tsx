import type { RulerOption } from "@workspace/db"
import { getRulerOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type RulerFilterComboboxProps = {
  onValueChange: (ruler: RulerOption | null) => Promise<void>
  rulers: RulerOption[]
  selectedRuler: RulerOption | null
}

export function RulerFilterCombobox({
  onValueChange,
  rulers,
  selectedRuler,
}: RulerFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<RulerOption>
      emptyMessage="No rulers found."
      items={rulers}
      itemToStringLabel={getRulerOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by ruler"
      renderItemLabel={getRulerOptionLabel}
      selectedItem={selectedRuler}
    />
  )
}
