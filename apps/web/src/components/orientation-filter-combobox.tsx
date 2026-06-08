import type { OrientationOption } from "@workspace/db"
import { getOrientationOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type OrientationFilterComboboxProps = {
  onValueChange: (orientation: OrientationOption | null) => Promise<void>
  orientations: OrientationOption[]
  selectedOrientation: OrientationOption | null
}

export function OrientationFilterCombobox({
  onValueChange,
  orientations,
  selectedOrientation,
}: OrientationFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<OrientationOption>
      emptyMessage="No orientations found."
      items={orientations}
      itemToStringLabel={getOrientationOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by orientation"
      selectedItem={selectedOrientation}
    />
  )
}
