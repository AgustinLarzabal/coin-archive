import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { ThemeDraft } from "./theme-form.shared"

type ThemeFieldName = keyof ThemeDraft
type ThemeFormFieldsProps = {
  children: (config: ThemeFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type ThemeFieldConfig = {
  field: ThemeFieldName
  id: string
  label: string
  placeholder: string
}

type ThemeTextFieldProps = ThemeFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function ThemeFormFields({ children, variant }: ThemeFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) =>
        children({
          field,
          id: `${prefix}theme-${field}`,
          label: `Theme ${field === "code" ? "Code" : "Name"}`,
          placeholder: field === "code" ? "round" : "Round",
        })
      )}
    </FieldGroup>
  )
}

export function ThemeTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: ThemeTextFieldProps) {
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
