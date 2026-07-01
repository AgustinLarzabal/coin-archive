import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import type { RulerGroupFieldErrors } from "@/lib/ruler-group-maintenance"

import type { RulerGroupDraft } from "./ruler-group-form.shared"

type RulerGroupFormFieldsProps = {
  codeInputId: string
  nameInputId: string
  codePlaceholder: string
  namePlaceholder: string
  draft: RulerGroupDraft
  fieldErrors: RulerGroupFieldErrors
  onDraftChange: <TFieldName extends keyof RulerGroupDraft>(
    field: TFieldName,
    value: RulerGroupDraft[TFieldName]
  ) => void
}

export function RulerGroupFormFields({
  codeInputId,
  nameInputId,
  codePlaceholder,
  namePlaceholder,
  draft,
  fieldErrors,
  onDraftChange,
}: RulerGroupFormFieldsProps) {
  const hasCodeError = fieldErrors.code !== undefined
  const hasNameError = fieldErrors.name !== undefined

  return (
    <FieldGroup>
      <Field data-invalid={hasCodeError}>
        <FieldLabel htmlFor={codeInputId}>Ruler Group Code</FieldLabel>
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
        <FieldLabel htmlFor={nameInputId}>Ruler Group Name</FieldLabel>
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
