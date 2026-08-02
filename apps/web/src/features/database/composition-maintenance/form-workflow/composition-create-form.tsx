import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitCreateComposition } from "../actions"
import type { CompositionMutationResult } from "../actions"
import { createCompositionInputSchema } from "../validation"
import type { CompositionFieldErrors } from "../validation"

type CompositionDraft = {
  code: string
  name: string
}

type CompositionCreateFormProps = {
  onCreated?: () => void
}

const EMPTY_DRAFT: CompositionDraft = {
  code: "",
  name: "",
}

const createCompositionAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: CompositionDraft & { idempotencyKey: string }) => data)
  .handler(async ({ data }) => submitCreateComposition(data))

export function isCompositionCreateReady(draft: CompositionDraft) {
  return draft.code.trim().length > 0 && draft.name.trim().length > 0
}

export function CompositionCreateForm({
  onCreated,
}: CompositionCreateFormProps) {
  const router = useRouter()
  const createComposition = useServerFn(createCompositionAction)
  const [fieldErrors, setFieldErrors] = useState<CompositionFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  )

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: CompositionMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  const form = useForm({
    defaultValues: EMPTY_DRAFT,
    validators: { onSubmit: createCompositionInputSchema },
    onSubmit: async ({ value }) => {
      const result = await createComposition({
        data: { ...value, idempotencyKey },
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        form.reset()
        setIdempotencyKey(crypto.randomUUID())
        await router.invalidate()
        onCreated?.()
      }
    },
  })

  return (
    <form
      id="database-composition-create-form"
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
                    id: "new-composition-code",
                    label: "Composition Code",
                    placeholder: "silver",
                  },
                  {
                    name: "name",
                    id: "new-composition-name",
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

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting || !isCompositionCreateReady(state.values)
                }
                className="w-full"
              >
                Create
              </SubmitButton>
            </div>
          </>
        )}
      </form.Subscribe>
    </form>
  )
}
