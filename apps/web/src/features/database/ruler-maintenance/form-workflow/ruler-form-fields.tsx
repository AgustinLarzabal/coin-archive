import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"

import type { RulerFieldErrors } from "../ruler-validation"

import type { RulerDraft, RulerGroupSelectionOption } from "./ruler-form.shared"

type RulerFormFieldsProps = {
  codeInputId: string
  nameInputId: string
  rulerGroupInputId: string
  rulerGroupOptionsListId: string
  codePlaceholder: string
  namePlaceholder: string
  rulerGroupPlaceholder: string
  draft: RulerDraft
  fieldErrors: RulerFieldErrors
  rulerGroupOptions: RulerGroupSelectionOption[]
  onDraftChange: <TFieldName extends keyof RulerDraft>(
    field: TFieldName,
    value: RulerDraft[TFieldName]
  ) => void
}

export function RulerFormFields({
  codeInputId,
  nameInputId,
  rulerGroupInputId,
  rulerGroupOptionsListId,
  codePlaceholder,
  namePlaceholder,
  rulerGroupPlaceholder,
  draft,
  fieldErrors,
  rulerGroupOptions,
  onDraftChange,
}: RulerFormFieldsProps) {
  const hasCodeError = fieldErrors.code !== undefined
  const hasNameError = fieldErrors.name !== undefined
  const hasRulerGroupError = fieldErrors.rulerGroupId !== undefined

  return (
    <FieldGroup>
      <Field data-invalid={hasCodeError}>
        <FieldLabel htmlFor={codeInputId}>Ruler Code</FieldLabel>
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
        <FieldLabel htmlFor={nameInputId}>Ruler Name</FieldLabel>
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
      <Field data-invalid={hasRulerGroupError}>
        <FieldLabel htmlFor={rulerGroupInputId}>Ruler Group</FieldLabel>
        <Input
          id={rulerGroupInputId}
          name="rulerGroup"
          list={rulerGroupOptionsListId}
          value={draft.rulerGroupLabel}
          onChange={(event) =>
            onDraftChange("rulerGroupLabel", event.target.value)
          }
          aria-invalid={hasRulerGroupError}
          placeholder={rulerGroupPlaceholder}
          autoComplete="off"
        />
        <datalist id={rulerGroupOptionsListId}>
          {rulerGroupOptions.map((option) => (
            <option key={option.id} value={option.label} />
          ))}
        </datalist>
        {fieldErrors.rulerGroupId ? (
          <FieldError errors={[{ message: fieldErrors.rulerGroupId }]} />
        ) : null}
      </Field>
    </FieldGroup>
  )
}
