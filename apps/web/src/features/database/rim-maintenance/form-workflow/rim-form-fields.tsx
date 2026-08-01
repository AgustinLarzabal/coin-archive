import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { RimDraft } from "./rim-form.shared"

type RimFieldName = keyof RimDraft
type RimFormFieldsProps = {
  children: (config: RimFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type RimFieldConfig = {
  field: RimFieldName
  id: string
  label: string
  placeholder: string
}

type RimTextFieldProps = RimFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function RimFormFields({ children, variant }: RimFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) =>
        children({
          field,
          id: `${prefix}rim-${field}`,
          label: `Rim ${field === "code" ? "Code" : "Name"}`,
          placeholder: field === "code" ? "raised" : "Raised",
        })
      )}
    </FieldGroup>
  )
}

export function RimTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: RimTextFieldProps) {
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
