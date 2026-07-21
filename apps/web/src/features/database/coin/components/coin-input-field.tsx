import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import type { ComponentProps } from "react"

type CoinInputFieldProps = {
  className?: string
  error?: string
  id: string
  label: string
  name?: string
  onValueChange: (value: string) => void
  type?: ComponentProps<typeof Input>["type"]
  value: string
}

export function CoinInputField({
  className,
  error,
  id,
  label,
  name,
  onValueChange,
  type,
  value,
}: CoinInputFieldProps) {
  return (
    <Field className={className} data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={error !== undefined}
      />
      <FieldError errors={error ? [{ message: error }] : undefined} />
    </Field>
  )
}
