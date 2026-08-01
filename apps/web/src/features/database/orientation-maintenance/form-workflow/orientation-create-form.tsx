import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitCreateOrientation } from "../actions"
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
import type { OrientationDraft } from "./orientation-form.shared"

type OrientationCreateFormProps = {
  onCreated?: () => void
}

const createOrientationAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: OrientationDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateOrientation(session?.user ?? null, data)
  })

export function OrientationCreateForm({
  onCreated,
}: OrientationCreateFormProps) {
  const router = useRouter()
  const createOrientation = useServerFn(createOrientationAction)
  const [fieldErrors, setFieldErrors] = useState<OrientationFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

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
        data: value,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        form.reset()
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
