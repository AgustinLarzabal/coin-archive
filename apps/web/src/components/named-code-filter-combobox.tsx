import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { isCodeOptionEqual } from "../lib/coin-search"

type NamedCodeOption = {
  code: string
  name: string
}

type NamedCodeFilterComboboxProps<T extends NamedCodeOption> = {
  emptyMessage: string
  itemToStringLabel: (item: T) => string
  items: T[]
  onValueChange: (item: T | null) => Promise<void>
  placeholder: string
  selectedItem: T | null
}

export function NamedCodeFilterCombobox<T extends NamedCodeOption>({
  emptyMessage,
  itemToStringLabel,
  items,
  onValueChange,
  placeholder,
  selectedItem,
}: NamedCodeFilterComboboxProps<T>) {
  return (
    <Combobox<T>
      items={items}
      value={selectedItem}
      itemToStringLabel={itemToStringLabel}
      isItemEqualToValue={isCodeOptionEqual}
      onValueChange={onValueChange}
    >
      <ComboboxInput placeholder={placeholder} showClear />
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item: T) => (
            <ComboboxItem key={item.code} value={item}>
              <span>{item.name}</span>
              <span className="text-muted-foreground">{item.code}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
