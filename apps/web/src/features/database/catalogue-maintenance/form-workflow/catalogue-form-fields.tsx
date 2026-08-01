import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import type { ReactNode } from "react"

import type { CatalogueDraft } from "./catalogue-form.shared"

type CatalogueFieldName = keyof CatalogueDraft

export type CatalogueFieldConfig = {
  field: CatalogueFieldName
  id: string
  label: string
  placeholder: string
}

type CatalogueFormFieldsProps = {
  children: (config: CatalogueFieldConfig) => ReactNode
  variant: "create" | "edit"
}

type CatalogueTextFieldProps = CatalogueFieldConfig & {
  errors: Array<{ message?: string } | undefined>
  isInvalid: boolean
  onBlur: () => void
  onChange: (value: string) => void
  value: string
}

const CREATE_CATALOGUE_FIELD_CONFIGS: CatalogueFieldConfig[] = [
  {
    field: "code",
    id: "new-catalogue-code",
    label: "Code",
    placeholder: "KM",
  },
  {
    field: "title",
    id: "new-catalogue-title",
    label: "Title",
    placeholder: "Standard Catalog of World Coins",
  },
]

const EDIT_CATALOGUE_FIELD_CONFIGS: CatalogueFieldConfig[] = [
  {
    field: "code",
    id: "catalogue-code",
    label: "Code",
    placeholder: "KM",
  },
  {
    field: "title",
    id: "catalogue-title",
    label: "Title",
    placeholder: "Standard Catalog of World Coins",
  },
]

function getCatalogueFieldConfigs(
  variant: CatalogueFormFieldsProps["variant"]
) {
  return variant === "create"
    ? CREATE_CATALOGUE_FIELD_CONFIGS
    : EDIT_CATALOGUE_FIELD_CONFIGS
}

export function CatalogueFormFields({
  children,
  variant,
}: CatalogueFormFieldsProps) {
  return (
    <FieldGroup>{getCatalogueFieldConfigs(variant).map(children)}</FieldGroup>
  )
}

export function CatalogueTextField({
  errors,
  field,
  id,
  isInvalid,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: CatalogueTextFieldProps) {
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
