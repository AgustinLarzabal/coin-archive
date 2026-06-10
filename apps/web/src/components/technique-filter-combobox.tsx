import type { TechniqueOption } from "@workspace/db"
import { getTechniqueOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type TechniqueFilterComboboxProps = {
  onValueChange: (technique: TechniqueOption | null) => Promise<void>
  selectedTechnique: TechniqueOption | null
  techniques: TechniqueOption[]
}

export function TechniqueFilterCombobox({
  onValueChange,
  selectedTechnique,
  techniques,
}: TechniqueFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<TechniqueOption>
      emptyMessage="No Minting Techniques found."
      items={techniques}
      itemToStringLabel={getTechniqueOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by Minting Technique"
      selectedItem={selectedTechnique}
    />
  )
}
