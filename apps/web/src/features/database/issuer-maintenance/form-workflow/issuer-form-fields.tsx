import type { ReactNode } from "react"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"

import type { IssuerFieldErrors } from "../validation"
import type { IssuerDraft, ParentIssuerOption } from "./issuer-form.shared"

export type IssuerFieldConfig = {
  errorField: keyof IssuerFieldErrors
  field: keyof IssuerDraft
  id: string
  label: string
  list?: string
  name: string
  placeholder: string
}

type IssuerFormFieldsProps = {
  children: (config: IssuerFieldConfig) => ReactNode
  parentIssuerOptions: ParentIssuerOption[]
  parentIssuerOptionsListId: string
  variant: "create" | "edit"
}

type IssuerTextFieldProps = IssuerFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

export function IssuerFormFields({
  children,
  parentIssuerOptions,
  parentIssuerOptionsListId,
  variant,
}: IssuerFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""
  const configs: IssuerFieldConfig[] = [
    {
      errorField: "code",
      field: "code",
      id: `${prefix}issuer-code`,
      label: "Issuer Code",
      name: "code",
      placeholder: "argentine-republic",
    },
    {
      errorField: "name",
      field: "name",
      id: `${prefix}issuer-name`,
      label: "Issuer Name",
      name: "name",
      placeholder: "Argentine Republic",
    },
    {
      errorField: "isoCode",
      field: "isoCode",
      id: `${prefix}issuer-iso-code`,
      label: "Issuer ISO Code",
      name: "isoCode",
      placeholder: "AR",
    },
    {
      errorField: "parentIssuerId",
      field: "parentIssuerLabel",
      id: `${prefix}parent-issuer`,
      label: "Parent Issuer",
      list: parentIssuerOptionsListId,
      name: "parentIssuer",
      placeholder: "Search Parent Issuer...",
    },
  ]

  return (
    <FieldGroup>
      {configs.map(children)}
      <datalist id={parentIssuerOptionsListId}>
        {parentIssuerOptions.map((option) => (
          <option key={option.id} value={option.label} />
        ))}
      </datalist>
    </FieldGroup>
  )
}

export function IssuerTextField({
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
}: IssuerTextFieldProps) {
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
