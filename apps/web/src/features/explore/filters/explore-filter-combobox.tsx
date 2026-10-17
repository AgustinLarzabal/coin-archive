import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

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
  const items = options.map((option) => option.value)
  const getLabel = (itemValue: string) =>
    options.find((option) => option.value === itemValue)?.label ?? itemValue

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
        placeholder={placeholder}
        showClear
        className="w-full md:w-[calc(33.3vw-(--spacing(10)))] lg:w-[calc(25vw-(--spacing(10)))] xl:w-[calc(20vw-(--spacing(20)))] 2xl:w-[calc(16.7vw-(--spacing(20)))]"
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(itemValue: string) => {
            const option = options.find(
              (candidate) => candidate.value === itemValue
            )

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
