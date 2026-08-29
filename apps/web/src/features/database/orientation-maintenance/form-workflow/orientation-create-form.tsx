import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { createOrientationMutation } from "../orientation-mutations"
import type { OrientationMutationResult } from "../orientation-mutation-errors"
import { createOrientationInputSchema } from "../orientation-validation"
import type { OrientationFieldErrors } from "../orientation-validation"

import {
  OrientationFormFields,
  OrientationTextField,
} from "./orientation-form-fields"
import {
  EMPTY_ORIENTATION_DRAFT,
  isOrientationDraftComplete,
} from "./orientation-form.shared"

type OrientationCreateFormProps = {
  onCreated?: () => void
}

export function OrientationCreateForm({
  onCreated,
}: OrientationCreateFormProps) {
  const router = useRouter()
  const createOrientation = useServerFn(createOrientationMutation)
  const [fieldErrors, setFieldErrors] = useState<OrientationFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  )

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: OrientationMutationResult) {
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
    defaultValues: EMPTY_ORIENTATION_DRAFT,
    validators: { onSubmit: createOrientationInputSchema },
    onSubmit: async ({ value }) => {
      const result = await createOrientation({
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
      id="database-orientation-create-form"
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
            <OrientationFormFields variant="create">
              {(config) => (
                <form.Field key={config.field} name={config.field}>
                  {(field) => {
                    const serverError = fieldErrors[config.field]
                    const isInvalid =
                      (field.state.meta.isTouched &&
                        !field.state.meta.isValid) ||
                      serverError !== undefined
                    const errors = serverError
                      ? [...field.state.meta.errors, { message: serverError }]
                      : field.state.meta.errors
                    return (
                      <OrientationTextField
                        {...config}
                        errors={errors}
                        isInvalid={isInvalid}
                        onBlur={field.handleBlur}
                        onChange={field.handleChange}
                        value={field.state.value}
                      />
                    )
                  }}
                </form.Field>
              )}
            </OrientationFormFields>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !isOrientationDraftComplete(state.values)
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
