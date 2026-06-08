import type { RimOption } from "@workspace/db"
import { getRimOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type RimFilterComboboxProps = {
  onValueChange: (rim: RimOption | null) => Promise<void>
  rims: RimOption[]
  selectedRim: RimOption | null
}

export function RimFilterCombobox({
  onValueChange,
  rims,
  selectedRim,
}: RimFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<RimOption>
      emptyMessage="No rims found."
      items={rims}
      itemToStringLabel={getRimOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by rim"
      selectedItem={selectedRim}
    />
  )
}
