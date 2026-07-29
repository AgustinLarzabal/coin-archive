import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"

import type { MintingTechniqueFieldErrors } from "../actions"

import type { MintingTechniqueDraft } from "./minting-technique-form.shared"

type MintingTechniqueFieldName = keyof MintingTechniqueDraft

type MintingTechniqueFieldConfig = {
  field: MintingTechniqueFieldName
  id: string
  label: string
  placeholder: string
}

type MintingTechniqueFormFieldsProps = {
  draft: MintingTechniqueDraft
  fieldErrors: MintingTechniqueFieldErrors
  onDraftChange: <TFieldName extends MintingTechniqueFieldName>(
    field: TFieldName,
    value: MintingTechniqueDraft[TFieldName]
  ) => void
  variant: "create" | "edit"
}

const CREATE_MINTING_TECHNIQUE_FIELD_CONFIGS: MintingTechniqueFieldConfig[] = [
  {
    field: "code",
    id: "new-minting-technique-code",
    label: "Minting Technique Code",
    placeholder: "hammered",
  },
  {
    field: "name",
    id: "new-minting-technique-name",
    label: "Minting Technique Name",
    placeholder: "Hammered",
  },
]

const EDIT_MINTING_TECHNIQUE_FIELD_CONFIGS: MintingTechniqueFieldConfig[] = [
  {
    field: "code",
    id: "minting-technique-code",
    label: "Minting Technique Code",
    placeholder: "hammered",
  },
  {
    field: "name",
    id: "minting-technique-name",
    label: "Minting Technique Name",
    placeholder: "Hammered",
  },
]

function getMintingTechniqueFieldConfigs(
  variant: MintingTechniqueFormFieldsProps["variant"]
) {
  return variant === "create"
    ? CREATE_MINTING_TECHNIQUE_FIELD_CONFIGS
    : EDIT_MINTING_TECHNIQUE_FIELD_CONFIGS
}

export function MintingTechniqueFormFields({
  draft,
  fieldErrors,
  onDraftChange,
  variant,
}: MintingTechniqueFormFieldsProps) {
  return (
    <FieldGroup>
      {getMintingTechniqueFieldConfigs(variant).map(
        ({ field, id, label, placeholder }) => {
          const error = fieldErrors[field]

          return (
            <Field key={field} data-invalid={error !== undefined}>
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
              <Input
                id={id}
                name={field}
                value={draft[field]}
                onChange={(event) => onDraftChange(field, event.target.value)}
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
