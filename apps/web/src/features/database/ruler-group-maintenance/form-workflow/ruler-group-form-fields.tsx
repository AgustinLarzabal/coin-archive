import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { RulerGroupDraft } from "./ruler-group-form.shared"

type RulerGroupFieldName = keyof RulerGroupDraft
type RulerGroupFormFieldsProps = {
  children: (config: RulerGroupFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type RulerGroupFieldConfig = {
  field: RulerGroupFieldName
  id: string
  label: string
  placeholder: string
}

type RulerGroupTextFieldProps = RulerGroupFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function RulerGroupFormFields({
  children,
  variant,
}: RulerGroupFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) =>
        children({
          field,
          id: `${prefix}ruler-group-${field}`,
          label: `Ruler Group ${field === "code" ? "Code" : "Name"}`,
          placeholder:
            field === "code" ? "house-of-bourbon" : "House of Bourbon",
        })
      )}
    </FieldGroup>
  )
}

export function RulerGroupTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: RulerGroupTextFieldProps) {
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
