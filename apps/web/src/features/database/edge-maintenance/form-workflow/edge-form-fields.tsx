import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { EdgeDraft } from "./edge-form.shared"

type EdgeFieldName = keyof EdgeDraft
type EdgeFormFieldsProps = {
  children: (config: EdgeFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type EdgeFieldConfig = {
  field: EdgeFieldName
  id: string
  label: string
  placeholder: string
}

type EdgeTextFieldProps = EdgeFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function EdgeFormFields({ children, variant }: EdgeFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) =>
        children({
          field,
          id: `${prefix}edge-${field}`,
          label: `Edge ${field === "code" ? "Code" : "Name"}`,
          placeholder: field === "code" ? "reeded" : "Reeded",
        })
      )}
    </FieldGroup>
  )
}

export function EdgeTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: EdgeTextFieldProps) {
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
