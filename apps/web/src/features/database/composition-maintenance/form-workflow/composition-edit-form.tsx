import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Composition } from "@coin-archive/api"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitUpdateComposition } from "../actions"
import type { CompositionMutationResult } from "../actions"
import { createCompositionInputSchema } from "../validation"
import type { CompositionFieldErrors } from "../validation"

type CompositionDraft = {
  code: string
  name: string
}

type CompositionEditFormProps = {
  composition: Composition
  onSaved?: () => void
}

const updateCompositionAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: CompositionDraft & { id: string; etag: string }) => data
  )
  .handler(async ({ data }) => submitUpdateComposition(data))

function createCompositionDraft(composition: Composition): CompositionDraft {
  return {
    code: composition.code,
    name: composition.name,
  }
}

function normalizeDraftForComparison(
  draft: CompositionDraft
): CompositionDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function hasCompositionEditChanges(
  composition: Composition,
  draft: CompositionDraft
) {
  const normalizedCurrent = normalizeDraftForComparison(
    createCompositionDraft(composition)
  )
  const normalizedDraft = normalizeDraftForComparison(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function CompositionEditForm({
  composition,
  onSaved,
}: CompositionEditFormProps) {
  const router = useRouter()
  const updateComposition = useServerFn(updateCompositionAction)
  const [fieldErrors, setFieldErrors] = useState<CompositionFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createCompositionDraft(composition),
    validators: { onSubmit: createCompositionInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateComposition({
        data: { id: composition.id, etag: composition.etag, ...value },
      })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createCompositionDraft(composition))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [composition, form])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: CompositionMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      setSuccessMessage(result.message)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    setSuccessMessage(null)
    return false
  }

  return (
    <form
      id="database-composition-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={(event) => {
        event.preventDefault()
        clearFeedback()
        void form.handleSubmit()
      }}
    >
      <form.Subscribe selector={(state) => state}>
        {(state) => (
          <>
            <FieldGroup>
              {(
                [
                  {
                    name: "code",
                    id: "composition-code",
                    label: "Composition Code",
                    placeholder: "silver",
                  },
                  {
                    name: "name",
                    id: "composition-name",
                    label: "Composition Name",
                    placeholder: "Silver",
                  },
                ] as const
              ).map((config) => (
                <form.Field key={config.name} name={config.name}>
                  {(field) => {
                    const serverError = fieldErrors[config.name]
                    const isInvalid =
                      (field.state.meta.isTouched &&
                        !field.state.meta.isValid) ||
                      serverError !== undefined
                    const errors = serverError
                      ? [...field.state.meta.errors, { message: serverError }]
                      : field.state.meta.errors
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={config.id}>
                          {config.label}
                        </FieldLabel>
                        <Input
                          id={config.id}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                          placeholder={config.placeholder}
                          autoComplete="off"
                        />
                        {isInvalid ? <FieldError errors={errors} /> : null}
                      </Field>
                    )
                  }}
                </form.Field>
              ))}
            </FieldGroup>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            {successMessage ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !hasCompositionEditChanges(composition, state.values)
                }
                className="w-full"
              >
                Save
              </SubmitButton>
            </div>
          </>
        )}
      </form.Subscribe>
    </form>
  )
}
