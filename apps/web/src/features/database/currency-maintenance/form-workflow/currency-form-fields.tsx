import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { CurrencyDraft } from "./currency-form.shared"

type CurrencyFieldName = keyof CurrencyDraft
type CurrencyFormFieldsProps = {
  children: (config: CurrencyFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type CurrencyFieldConfig = {
  field: CurrencyFieldName
  id: string
  label: string
  placeholder: string
}

type CurrencyTextFieldProps = CurrencyFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function CurrencyFormFields({
  children,
  variant,
}: CurrencyFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""
  const configs: CurrencyFieldConfig[] = [
    {
      field: "code",
      id: `${prefix}currency-code`,
      label: "Currency Code",
      placeholder: "ars",
    },
    {
      field: "name",
      id: `${prefix}currency-name`,
      label: "Currency Name",
      placeholder: "Peso",
    },
    {
      field: "fullName",
      id: `${prefix}currency-full-name`,
      label: "Currency Full Name",
      placeholder: "Argentine peso",
    },
  ]

  return <FieldGroup>{configs.map(children)}</FieldGroup>
}

export function CurrencyTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: CurrencyTextFieldProps) {
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={field}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isInvalid ? <FieldError errors={errors} /> : null}
    </Field>
  )
}
