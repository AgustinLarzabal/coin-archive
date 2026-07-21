import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@workspace/ui/components/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import type { CoinOption } from "./coin-select-field"

type CoinMultiComboboxFieldProps = {
  description?: string
  errors: string[]
  id: string
  label: string
  onValueChange: (values: string[]) => void
  options: CoinOption[]
  placeholder: string
  values: string[]
}

function createOptionLabel(option: CoinOption) {
  return `${option.name ?? option.title} (${option.code})`
}

export function CoinMultiComboboxField({
  description,
  errors,
  id,
  label,
  onValueChange,
  options,
  placeholder,
  values,
}: CoinMultiComboboxFieldProps) {
  const selectedOptions = values.flatMap((value) =>
    options.filter((option) => option.id === value)
  )

  return (
    <Field data-invalid={errors.length > 0}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={options}
        itemToStringValue={createOptionLabel}
        multiple
        value={selectedOptions}
        onValueChange={(selected) =>
          onValueChange(selected.map((option) => option.id))
        }
      >
        <ComboboxChips>
          <ComboboxValue>
            {selectedOptions.map((option) => (
              <ComboboxChip key={option.id}>
                {createOptionLabel(option)}
              </ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput id={id} placeholder={placeholder} />
        </ComboboxChips>
        <ComboboxContent>
          <ComboboxEmpty>No options found.</ComboboxEmpty>
          <ComboboxList>
            {(option) => (
              <ComboboxItem key={option.id} value={option}>
                {createOptionLabel(option)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={errors.map((message) => ({ message }))} />
    </Field>
  )
}
