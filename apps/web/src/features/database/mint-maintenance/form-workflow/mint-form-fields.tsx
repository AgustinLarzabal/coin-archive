import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { MintDraft } from "./mint-form.shared"

type MintFieldName = keyof MintDraft
type MintFormFieldsProps = {
  children: (config: MintFieldConfig) => ReactNode
  variant: "create" | "edit"
}

export type MintFieldConfig = {
  field: MintFieldName
  id: string
  label: string
  placeholder: string
}

type MintTextFieldProps = MintFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function MintFormFields({ children, variant }: MintFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) =>
        children({
          field,
          id: `${prefix}mint-${field}`,
          label: `Mint ${field === "code" ? "Code" : "Name"}`,
          placeholder:
            field === "code" ? "buenos-aires-mint" : "Buenos Aires Mint",
        })
      )}
    </FieldGroup>
  )
}

export function MintTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: MintTextFieldProps) {
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
