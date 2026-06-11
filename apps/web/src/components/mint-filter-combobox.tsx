import type { MintOption } from "@workspace/db"
import { getMintOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type MintFilterComboboxProps = {
  mints: MintOption[]
  onValueChange: (mint: MintOption | null) => Promise<void>
  selectedMint: MintOption | null
}

export function MintFilterCombobox({
  mints,
  onValueChange,
  selectedMint,
}: MintFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<MintOption>
      emptyMessage="No mints found."
      items={mints}
      itemToStringLabel={getMintOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by mint"
      selectedItem={selectedMint}
    />
  )
}
