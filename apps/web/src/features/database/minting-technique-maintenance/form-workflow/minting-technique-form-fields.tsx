import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { MintingTechniqueDraft } from "./minting-technique-form.shared"

type MintingTechniqueFieldName = keyof MintingTechniqueDraft
type MintingTechniqueFormFieldsProps = {
  children: (config: MintingTechniqueFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type MintingTechniqueFieldConfig = {
  field: MintingTechniqueFieldName
  id: string
  label: string
  placeholder: string
}

type MintingTechniqueTextFieldProps = MintingTechniqueFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function MintingTechniqueFormFields({
  children,
  variant,
}: MintingTechniqueFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) =>
        children({
          field,
          id: `${prefix}minting-technique-${field}`,
          label: `Minting Technique ${field === "code" ? "Code" : "Name"}`,
          placeholder: field === "code" ? "hammered" : "Hammered",
        })
      )}
    </FieldGroup>
  )
}

export function MintingTechniqueTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: MintingTechniqueTextFieldProps) {
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
