import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { RulerFieldErrors } from "../ruler-validation"

import type { RulerDraft, RulerGroupSelectionOption } from "./ruler-form.shared"

type RulerFormFieldsProps = {
  children: (config: RulerFieldConfig) => ReactNode
  rulerGroupOptionsListId: string
  rulerGroupOptions: RulerGroupSelectionOption[]
  variant: "create" | "edit"
}

export type RulerFieldConfig = {
  errorField: keyof RulerFieldErrors
  field: keyof RulerDraft
  id: string
  label: string
  list?: string
  name: string
  placeholder: string
}

type RulerTextFieldProps = RulerFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function RulerFormFields({
  children,
  rulerGroupOptionsListId,
  rulerGroupOptions,
  variant,
}: RulerFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""
  const configs: RulerFieldConfig[] = [
    {
      errorField: "code",
      field: "code",
      id: `${prefix}ruler-code`,
      label: "Ruler Code",
      name: "code",
      placeholder: "felipe-v",
    },
    {
      errorField: "name",
      field: "name",
      id: `${prefix}ruler-name`,
      label: "Ruler Name",
      name: "name",
      placeholder: "Felipe V",
    },
    {
      errorField: "rulerGroupId",
      field: "rulerGroupLabel",
      id: `${prefix}ruler-group`,
      label: "Ruler Group",
      list: rulerGroupOptionsListId,
      name: "rulerGroup",
      placeholder: "House of Bourbon (house-of-bourbon)",
    },
  ]

  return (
    <FieldGroup>
      {configs.map(children)}
      <datalist id={rulerGroupOptionsListId}>
        {rulerGroupOptions.map((option) => (
          <option key={option.id} value={option.label} />
        ))}
      </datalist>
    </FieldGroup>
  )
}

export function RulerTextField({
  errors,
  id,
  isInvalid,
  label,
  list,
  name,
  onBlur,
  onChange,
  placeholder,
  value,
}: RulerTextFieldProps) {
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        list={list}
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
