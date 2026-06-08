import type { RimOption } from "@workspace/db"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { getRimOptionLabel, isCodeOptionEqual } from "../lib/coin-search"

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
    <Combobox<RimOption>
      items={rims}
      value={selectedRim}
      itemToStringLabel={getRimOptionLabel}
      isItemEqualToValue={isCodeOptionEqual}
      onValueChange={onValueChange}
    >
      <ComboboxInput placeholder="Filter by rim" showClear />
      <ComboboxContent>
        <ComboboxEmpty>No rims found.</ComboboxEmpty>
        <ComboboxList>
          {(rim: RimOption) => (
            <ComboboxItem key={rim.code} value={rim}>
              <span>{rim.name}</span>
              <span className="text-muted-foreground">{rim.code}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
