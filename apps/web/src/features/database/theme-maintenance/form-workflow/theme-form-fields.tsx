import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import type { ThemeFieldErrors } from "../actions"

import type { ThemeDraft } from "./theme-form.shared"

type ThemeFormFieldsProps = {
  codeInputId: string
  nameInputId: string
  codePlaceholder: string
  namePlaceholder: string
  draft: ThemeDraft
  fieldErrors: ThemeFieldErrors
  onDraftChange: <TFieldName extends keyof ThemeDraft>(
    field: TFieldName,
    value: ThemeDraft[TFieldName]
  ) => void
}

export function ThemeFormFields({
  codeInputId,
  nameInputId,
  codePlaceholder,
  namePlaceholder,
  draft,
  fieldErrors,
  onDraftChange,
}: ThemeFormFieldsProps) {
  const hasCodeError = fieldErrors.code !== undefined
  const hasNameError = fieldErrors.name !== undefined

  return (
    <FieldGroup>
      <Field data-invalid={hasCodeError}>
        <FieldLabel htmlFor={codeInputId}>Theme Code</FieldLabel>
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
        <FieldLabel htmlFor={nameInputId}>Theme Name</FieldLabel>
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
