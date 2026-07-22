import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"

export type CoinOption = {
  id: string
  code: string
  name?: string
  title?: string
}

type CoinSelectFieldProps = {
  className?: string
  error?: string
  id: string
  label: string
  name?: string
  onValueChange: (value: string) => void
  options: CoinOption[]
  placeholder: string
  required?: boolean
  value: string
}

function createOptionLabel(option: CoinOption) {
  return `${option.name ?? option.title} (${option.code})`
}

export function CoinSelectField({
  className,
  error,
  id,
  label,
  name,
  onValueChange,
  options,
  placeholder,
  required = false,
  value,
}: CoinSelectFieldProps) {
  const selectItems = options.map((option) => ({
    label: createOptionLabel(option),
    value: option.id,
  }))

  return (
    <Field className={className} data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id}>
        {label} <FieldRequirement required={required} />
      </FieldLabel>
      <Select
        items={selectItems}
        name={name}
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue ?? "")}
      >
        <SelectTrigger
          id={id}
          aria-invalid={error !== undefined}
          aria-required={required}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {createOptionLabel(option)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldError errors={error ? [{ message: error }] : undefined} />
    </Field>
  )
}

function FieldRequirement({ required }: { required: boolean }) {
  if (!required) return null

  return <span className="font-normal text-muted-foreground">(Required)</span>
}
