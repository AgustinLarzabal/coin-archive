import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@coin-archive/ui/components/combobox"

type ExploreFilterOption = {
  disabled?: boolean
  label: string
  value: string
}

export function ExploreFilterCombobox({
  emptyMessage,
  id,
  label,
  name,
  onValueChange,
  options,
  placeholder,
  value,
}: {
  emptyMessage: string
  id?: string
  label: string
  name?: string
  onValueChange: (value: string | null) => void
  options: Array<ExploreFilterOption>
  placeholder: string
  value: string | null
}) {
  const items: Array<string> = []
  const optionsByValue = new Map<string, ExploreFilterOption>()
  for (const option of options) {
    items.push(option.value)
    if (!optionsByValue.has(option.value)) {
      optionsByValue.set(option.value, option)
    }
  }
  const getLabel = (itemValue: string) =>
    optionsByValue.get(itemValue)?.label ?? itemValue

  return (
    <Combobox
      autoHighlight
      items={items}
      itemToStringLabel={getLabel}
      modal={false}
      name={name}
      value={value}
      onValueChange={onValueChange}
    >
      <ComboboxInput
        id={id}
        aria-label={label}
        clearLabel={`Clear ${label}`}
        placeholder={placeholder}
        showClear
        className="w-full md:w-[calc(33.3vw-(--spacing(10)))] lg:w-[calc(25vw-(--spacing(10)))] xl:w-[calc(20vw-(--spacing(20)))] 2xl:w-[calc(16.7vw-(--spacing(20)))]"
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(itemValue: string) => {
            const option = optionsByValue.get(itemValue)

            return (
              <ComboboxItem
                key={itemValue}
                value={itemValue}
                disabled={option?.disabled}
              >
                {option?.label}
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
