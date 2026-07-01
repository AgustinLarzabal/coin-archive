import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import type { ShapeFieldErrors } from "@/lib/shape-maintenance"

import type { ShapeDraft } from "./shape-form.shared"

type ShapeFormFieldsProps = {
  codeInputId: string
  nameInputId: string
  codePlaceholder: string
  namePlaceholder: string
  draft: ShapeDraft
  fieldErrors: ShapeFieldErrors
  onDraftChange: <TFieldName extends keyof ShapeDraft>(
    field: TFieldName,
    value: ShapeDraft[TFieldName]
  ) => void
}

export function ShapeFormFields({
  codeInputId,
  nameInputId,
  codePlaceholder,
  namePlaceholder,
  draft,
  fieldErrors,
  onDraftChange,
}: ShapeFormFieldsProps) {
  const hasCodeError = fieldErrors.code !== undefined
  const hasNameError = fieldErrors.name !== undefined

  return (
    <FieldGroup>
      <Field data-invalid={hasCodeError}>
        <FieldLabel htmlFor={codeInputId}>Shape Code</FieldLabel>
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
        <FieldLabel htmlFor={nameInputId}>Shape Name</FieldLabel>
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
