import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"

import type { CatalogueFieldErrors } from "../catalogue-validation"

import type { CatalogueDraft } from "./catalogue-form.shared"

type CatalogueFieldName = keyof CatalogueDraft

type CatalogueFieldConfig = {
  field: CatalogueFieldName
  id: string
  label: string
  placeholder: string
}

type CatalogueFormFieldsProps = {
  draft: CatalogueDraft
  fieldErrors: CatalogueFieldErrors
  onFieldChange: <TFieldName extends CatalogueFieldName>(
    field: TFieldName,
    value: CatalogueDraft[TFieldName]
  ) => void
  variant: "create" | "edit"
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
  draft,
  fieldErrors,
  onFieldChange,
  variant,
}: CatalogueFormFieldsProps) {
  return (
    <FieldGroup>
      {getCatalogueFieldConfigs(variant).map(
        ({ field, id, label, placeholder }) => {
          const error = fieldErrors[field]

          return (
            <Field key={field} data-invalid={error !== undefined}>
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
              <Input
                id={id}
                name={field}
                value={draft[field]}
                onChange={(event) => onFieldChange(field, event.target.value)}
                aria-invalid={error !== undefined}
                placeholder={placeholder}
                autoComplete="off"
              />
              {error ? <FieldError errors={[{ message: error }]} /> : null}
            </Field>
          )
        }
      )}
    </FieldGroup>
  )
}
