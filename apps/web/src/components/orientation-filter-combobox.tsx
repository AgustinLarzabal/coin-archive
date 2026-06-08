import type { OrientationOption } from "@workspace/db"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import {
  getOrientationOptionLabel,
  isCodeOptionEqual,
} from "../lib/coin-search"

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
    <Combobox<OrientationOption>
      items={orientations}
      value={selectedOrientation}
      itemToStringLabel={getOrientationOptionLabel}
      isItemEqualToValue={isCodeOptionEqual}
      onValueChange={onValueChange}
    >
      <ComboboxInput placeholder="Filter by orientation" showClear />
      <ComboboxContent>
        <ComboboxEmpty>No orientations found.</ComboboxEmpty>
        <ComboboxList>
          {(orientation: OrientationOption) => (
            <ComboboxItem key={orientation.code} value={orientation}>
              <span>{orientation.name}</span>
              <span className="text-muted-foreground">{orientation.code}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
