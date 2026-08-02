import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Orientation as OrientationOption } from "@coin-archive/api"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitUpdateOrientation } from "../actions"
import type { OrientationMutationResult } from "../orientation-mutation-errors"
import { createOrientationInputSchema } from "../orientation-validation"
import type { OrientationFieldErrors } from "../orientation-validation"

import {
  OrientationFormFields,
  OrientationTextField,
} from "./orientation-form-fields"
import {
  createOrientationDraft,
  hasOrientationEditChanges,
} from "./orientation-form.shared"
import type { OrientationDraft } from "./orientation-form.shared"

type OrientationEditFormProps = {
  orientation: OrientationOption
  onSaved?: () => void
}

const updateOrientationAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: OrientationDraft & { id: string; etag: string }) => data
  )
  .handler(async ({ data }) => submitUpdateOrientation(data))

export function OrientationEditForm({
  orientation,
  onSaved,
}: OrientationEditFormProps) {
  const router = useRouter()
  const updateOrientation = useServerFn(updateOrientationAction)
  const [fieldErrors, setFieldErrors] = useState<OrientationFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createOrientationDraft(orientation),
    validators: { onSubmit: createOrientationInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateOrientation({
        data: { id: orientation.id, etag: orientation.etag, ...value },
      })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createOrientationDraft(orientation))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [orientation, form])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: OrientationMutationResult) {
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
      id="database-orientation-edit-form"
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
            <OrientationFormFields variant="edit">
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
            {successMessage ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !hasOrientationEditChanges(orientation, state.values)
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
