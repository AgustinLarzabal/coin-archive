import type { EngraverOption } from "@workspace/db"
import { getEngraverOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type EngraverFilterComboboxProps = {
  engravers: EngraverOption[]
  onValueChange: (engraver: EngraverOption | null) => Promise<void>
  selectedEngraver: EngraverOption | null
}

export function EngraverFilterCombobox({
  engravers,
  onValueChange,
  selectedEngraver,
}: EngraverFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<EngraverOption>
      emptyMessage="No engravers found."
      items={engravers}
      itemToStringLabel={getEngraverOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by engraver"
      selectedItem={selectedEngraver}
    />
  )
}
