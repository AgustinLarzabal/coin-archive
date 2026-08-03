import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Engraver } from "@coin-archive/api"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitUpdateEngraver } from "../actions"
import type { EngraverMutationResult } from "../actions"
import { createEngraverInputSchema } from "../engraver-validation"
import type { EngraverFieldErrors } from "../engraver-validation"

import {
  createEngraverDraft,
  hasEngraverEditChanges,
} from "./engraver-form.shared"
import { EngraverFormFields, EngraverTextField } from "./engraver-form-fields"
import type { EngraverDraft } from "./engraver-form.shared"

type EngraverEditFormProps = {
  engraver: Engraver
  onSaved?: () => void
}

const updateEngraverAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: EngraverDraft & { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitUpdateEngraver(data))

export function EngraverEditForm({ engraver, onSaved }: EngraverEditFormProps) {
  const router = useRouter()
  const updateEngraver = useServerFn(updateEngraverAction)
  const [fieldErrors, setFieldErrors] = useState<EngraverFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createEngraverDraft(engraver),
    validators: { onSubmit: createEngraverInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateEngraver({
        data: { id: engraver.id, etag: engraver.etag, ...value },
      })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createEngraverDraft(engraver))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, engraver])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: EngraverMutationResult) {
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
      id="database-engraver-edit-form"
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
            <EngraverFormFields variant="edit">
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
                      <EngraverTextField
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
            </EngraverFormFields>

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
                  !hasEngraverEditChanges(engraver, state.values)
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
