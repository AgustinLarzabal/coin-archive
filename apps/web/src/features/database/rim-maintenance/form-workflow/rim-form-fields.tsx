import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import type { RimFieldErrors } from "../actions"

import type { RimDraft } from "./rim-form.shared"

type RimFormFieldsProps = {
  codeInputId: string
  nameInputId: string
  codePlaceholder: string
  namePlaceholder: string
  draft: RimDraft
  fieldErrors: RimFieldErrors
  onDraftChange: <TFieldName extends keyof RimDraft>(
    field: TFieldName,
    value: RimDraft[TFieldName]
  ) => void
}

export function RimFormFields({
  codeInputId,
  nameInputId,
  codePlaceholder,
  namePlaceholder,
  draft,
  fieldErrors,
  onDraftChange,
}: RimFormFieldsProps) {
  const hasCodeError = fieldErrors.code !== undefined
  const hasNameError = fieldErrors.name !== undefined

  return (
    <FieldGroup>
      <Field data-invalid={hasCodeError}>
        <FieldLabel htmlFor={codeInputId}>Rim Code</FieldLabel>
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
        <FieldLabel htmlFor={nameInputId}>Rim Name</FieldLabel>
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
