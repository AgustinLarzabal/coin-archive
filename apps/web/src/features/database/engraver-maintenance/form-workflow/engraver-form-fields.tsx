import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { EngraverDraft } from "./engraver-form.shared"

type EngraverFieldName = keyof EngraverDraft
type EngraverFormFieldsProps = {
  children: (config: EngraverFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type EngraverFieldConfig = {
  field: EngraverFieldName
  id: string
  label: string
  placeholder: string
}

type EngraverTextFieldProps = EngraverFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function EngraverFormFields({
  children,
  variant,
}: EngraverFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) =>
        children({
          field,
          id: `${prefix}engraver-${field}`,
          label: `Engraver ${field === "code" ? "Code" : "Name"}`,
          placeholder: field === "code" ? "barth" : "Barth",
        })
      )}
    </FieldGroup>
  )
}

export function EngraverTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: EngraverTextFieldProps) {
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
