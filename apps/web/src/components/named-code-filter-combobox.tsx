import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { isCodeOptionEqual } from "../lib/coin-search"

type CodeOption = {
  code: string
}

type CodeFilterComboboxProps<T extends CodeOption> = {
  emptyMessage: string
  itemToStringLabel: (item: T) => string
  items: T[]
  onValueChange: (item: T | null) => Promise<void>
  placeholder: string
  renderItemLabel?: (item: T) => string
  showCode?: boolean
  selectedItem: T | null
}

export function NamedCodeFilterCombobox<T extends CodeOption>({
  emptyMessage,
  itemToStringLabel,
  items,
  onValueChange,
  placeholder,
  renderItemLabel = itemToStringLabel,
  showCode = true,
  selectedItem,
}: CodeFilterComboboxProps<T>) {
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
              <span>{renderItemLabel(item)}</span>
              {showCode ? (
                <span className="text-muted-foreground">{item.code}</span>
              ) : null}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
