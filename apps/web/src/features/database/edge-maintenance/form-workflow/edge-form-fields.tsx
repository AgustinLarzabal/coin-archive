import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"

import type { EdgeFieldErrors } from "../edge-validation"
import type { EdgeDraft } from "./edge-form.shared"

type EdgeFieldName = keyof EdgeDraft
type EdgeFormFieldsProps = {
  draft: EdgeDraft
  fieldErrors: EdgeFieldErrors
  onFieldChange: <TFieldName extends EdgeFieldName>(
    field: TFieldName,
    value: EdgeDraft[TFieldName]
  ) => void
  variant: "create" | "edit"
}

export function EdgeFormFields({
  draft,
  fieldErrors,
  onFieldChange,
  variant,
}: EdgeFormFieldsProps) {
  const prefix = variant === "create" ? "new-" : ""

  return (
    <FieldGroup>
      {(["code", "name"] as const).map((field) => {
        const id = `${prefix}edge-${field}`
        const error = fieldErrors[field]
        return (
          <Field key={field} data-invalid={error !== undefined}>
            <FieldLabel htmlFor={id}>
              Edge {field === "code" ? "Code" : "Name"}
            </FieldLabel>
            <Input
              id={id}
              name={field}
              value={draft[field]}
              onChange={(event) => onFieldChange(field, event.target.value)}
              aria-invalid={error !== undefined}
              placeholder={field === "code" ? "reeded" : "Reeded"}
              autoComplete="off"
            />
            {error ? <FieldError errors={[{ message: error }]} /> : null}
          </Field>
        )
      })}
    </FieldGroup>
  )
}
