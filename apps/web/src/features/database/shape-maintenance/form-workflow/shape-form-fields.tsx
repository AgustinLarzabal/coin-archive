import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { ShapeDraft } from "./shape-form.shared"

type ShapeFieldName = keyof ShapeDraft
type ShapeFormFieldsProps = {
  children: (config: ShapeFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type ShapeFieldConfig = {
  field: ShapeFieldName
  id: string
  label: string
  placeholder: string
}

type ShapeTextFieldProps = ShapeFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function ShapeFormFields({ children, variant }: ShapeFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) =>
        children({
          field,
          id: `${prefix}shape-${field}`,
          label: `Shape ${field === "code" ? "Code" : "Name"}`,
          placeholder: field === "code" ? "round" : "Round",
        })
      )}
    </FieldGroup>
  )
}

export function ShapeTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: ShapeTextFieldProps) {
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
