import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"

import type { OrientationFieldErrors } from "../orientation-validation"

import type { OrientationDraft } from "./orientation-form.shared"

type OrientationFieldName = keyof OrientationDraft

type OrientationFieldConfig = {
  field: OrientationFieldName
  id: string
  label: string
  placeholder: string
}

type OrientationFormFieldsProps = {
  draft: OrientationDraft
  fieldErrors: OrientationFieldErrors
  onFieldChange: <TFieldName extends OrientationFieldName>(
    field: TFieldName,
    value: OrientationDraft[TFieldName]
  ) => void
  variant: "create" | "edit"
}

const CREATE_ORIENTATION_FIELD_CONFIGS: OrientationFieldConfig[] = [
  {
    field: "code",
    id: "new-orientation-code",
    label: "Orientation Code",
    placeholder: "coin-alignment",
  },
  {
    field: "name",
    id: "new-orientation-name",
    label: "Orientation Name",
    placeholder: "Coin alignment",
  },
]

const EDIT_ORIENTATION_FIELD_CONFIGS: OrientationFieldConfig[] = [
  {
    field: "code",
    id: "orientation-code",
    label: "Orientation Code",
    placeholder: "coin-alignment",
  },
  {
    field: "name",
    id: "orientation-name",
    label: "Orientation Name",
    placeholder: "Coin alignment",
  },
]

function getOrientationFieldConfigs(
  variant: OrientationFormFieldsProps["variant"]
) {
  return variant === "create"
    ? CREATE_ORIENTATION_FIELD_CONFIGS
    : EDIT_ORIENTATION_FIELD_CONFIGS
}

export function OrientationFormFields({
  draft,
  fieldErrors,
  onFieldChange,
  variant,
}: OrientationFormFieldsProps) {
  return (
    <FieldGroup>
      {getOrientationFieldConfigs(variant).map(
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
