import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import type { MintingTechniqueFieldErrors } from "@/lib/minting-technique-maintenance"

import type { MintingTechniqueDraft } from "./minting-technique-form.shared"

type MintingTechniqueFormFieldsProps = {
  codeInputId: string
  nameInputId: string
  codePlaceholder: string
  namePlaceholder: string
  draft: MintingTechniqueDraft
  fieldErrors: MintingTechniqueFieldErrors
  onDraftChange: <TFieldName extends keyof MintingTechniqueDraft>(
    field: TFieldName,
    value: MintingTechniqueDraft[TFieldName]
  ) => void
}

export function MintingTechniqueFormFields({
  codeInputId,
  nameInputId,
  codePlaceholder,
  namePlaceholder,
  draft,
  fieldErrors,
  onDraftChange,
}: MintingTechniqueFormFieldsProps) {
  const hasCodeError = fieldErrors.code !== undefined
  const hasNameError = fieldErrors.name !== undefined

  return (
    <FieldGroup>
      <Field data-invalid={hasCodeError}>
        <FieldLabel htmlFor={codeInputId}>Minting Technique Code</FieldLabel>
        <Input
          id={codeInputId}
          name="code"
          value={draft.code}
          onChange={(event) => onDraftChange("code", event.target.value)}
          aria-invalid={hasCodeError}
          placeholder={codePlaceholder}
          autoComplete="off"
        />
        {fieldErrors.code ? (
          <FieldError errors={[{ message: fieldErrors.code }]} />
        ) : null}
      </Field>
      <Field data-invalid={hasNameError}>
        <FieldLabel htmlFor={nameInputId}>Minting Technique Name</FieldLabel>
        <Input
          id={nameInputId}
          name="name"
          value={draft.name}
          onChange={(event) => onDraftChange("name", event.target.value)}
          aria-invalid={hasNameError}
          placeholder={namePlaceholder}
          autoComplete="off"
        />
        {fieldErrors.name ? (
          <FieldError errors={[{ message: fieldErrors.name }]} />
        ) : null}
      </Field>
    </FieldGroup>
  )
}
