import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import type { MintFieldErrors } from "./actions"

import type { MintDraft } from "./mint-form.shared"

type MintFieldName = keyof MintDraft

type MintFieldConfig = {
  field: MintFieldName
  id: string
  label: string
  placeholder: string
}

type MintFormFieldsProps = {
  draft: MintDraft
  fieldErrors: MintFieldErrors
  onFieldChange: <TFieldName extends MintFieldName>(
    field: TFieldName,
    value: MintDraft[TFieldName]
  ) => void
  variant: "create" | "edit"
}

const CREATE_MINT_FIELD_CONFIGS: MintFieldConfig[] = [
  {
    field: "code",
    id: "new-mint-code",
    label: "Mint Code",
    placeholder: "buenos-aires-mint",
  },
  {
    field: "name",
    id: "new-mint-name",
    label: "Mint Name",
    placeholder: "Buenos Aires Mint",
  },
]

const EDIT_MINT_FIELD_CONFIGS: MintFieldConfig[] = [
  {
    field: "code",
    id: "mint-code",
    label: "Mint Code",
    placeholder: "buenos-aires-mint",
  },
  {
    field: "name",
    id: "mint-name",
    label: "Mint Name",
    placeholder: "Buenos Aires Mint",
  },
]

function getMintFieldConfigs(variant: MintFormFieldsProps["variant"]) {
  return variant === "create"
    ? CREATE_MINT_FIELD_CONFIGS
    : EDIT_MINT_FIELD_CONFIGS
}

export function MintFormFields({
  draft,
  fieldErrors,
  onFieldChange,
  variant,
}: MintFormFieldsProps) {
  return (
    <FieldGroup>
      {getMintFieldConfigs(variant).map(({ field, id, label, placeholder }) => {
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
      })}
    </FieldGroup>
  )
}
