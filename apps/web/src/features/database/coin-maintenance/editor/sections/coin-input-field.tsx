import { Field, FieldError, FieldLabel } from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ComponentProps } from "react"

type CoinInputFieldProps = {
  className?: string
  error?: string
  id: string
  label: string
  name?: string
  onValueChange: (value: string) => void
  required?: boolean
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
  required = false,
  type,
  value,
}: CoinInputFieldProps) {
  return (
    <Field className={className} data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id}>
        {label} <FieldRequirement required={required} />
      </FieldLabel>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={error !== undefined}
        aria-required={required}
        required={required}
      />
      <FieldError errors={error ? [{ message: error }] : undefined} />
    </Field>
  )
}

function FieldRequirement({ required }: { required: boolean }) {
  if (!required) return null

  return <span className="font-normal text-muted-foreground">(Required)</span>
}
