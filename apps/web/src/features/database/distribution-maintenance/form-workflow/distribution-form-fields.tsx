import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { DistributionDraft } from "./distribution-form.shared"

type DistributionFieldName = keyof DistributionDraft
type DistributionFormFieldsProps = {
  children: (config: DistributionFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type DistributionFieldConfig = {
  field: DistributionFieldName
  id: string
  label: string
  placeholder: string
}

type DistributionTextFieldProps = DistributionFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function DistributionFormFields({
  children,
  variant,
}: DistributionFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) =>
        children({
          field,
          id: `${prefix}distribution-${field}`,
          label: `Distribution ${field === "code" ? "Code" : "Name"}`,
          placeholder:
            field === "code" ? "standard-circulation" : "Standard circulation",
        })
      )}
    </FieldGroup>
  )
}

export function DistributionTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: DistributionTextFieldProps) {
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
