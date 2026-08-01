import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { OrientationDraft } from "./orientation-form.shared"

type OrientationFieldName = keyof OrientationDraft
type OrientationFormFieldsProps = {
  children: (config: OrientationFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type OrientationFieldConfig = {
  field: OrientationFieldName
  id: string
  label: string
  placeholder: string
}

type OrientationTextFieldProps = OrientationFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function OrientationFormFields({
  children,
  variant,
}: OrientationFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) =>
        children({
          field,
          id: `${prefix}orientation-${field}`,
          label: `Orientation ${field === "code" ? "Code" : "Name"}`,
          placeholder: field === "code" ? "coin-alignment" : "Coin alignment",
        })
      )}
    </FieldGroup>
  )
}

export function OrientationTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: OrientationTextFieldProps) {
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
