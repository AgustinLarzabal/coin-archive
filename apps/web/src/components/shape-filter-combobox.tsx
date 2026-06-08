import type { ShapeOption } from "@workspace/db"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { getShapeOptionLabel, isCodeOptionEqual } from "../lib/coin-search"

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
    <Combobox<ShapeOption>
      items={shapes}
      value={selectedShape}
      itemToStringLabel={getShapeOptionLabel}
      isItemEqualToValue={isCodeOptionEqual}
      onValueChange={onValueChange}
    >
      <ComboboxInput placeholder="Filter by shape" showClear />
      <ComboboxContent>
        <ComboboxEmpty>No shapes found.</ComboboxEmpty>
        <ComboboxList>
          {(shape: ShapeOption) => (
            <ComboboxItem key={shape.code} value={shape}>
              <span>{shape.name}</span>
              <span className="text-muted-foreground">{shape.code}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
