import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RimOption } from "@coin-archive/db"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type { RimFieldErrors, RimMutationResult } from "../actions"
import { createRimInputSchema, submitUpdateRim } from "../actions"

import { createRimDraft, normalizeRimDraft } from "./rim-form.shared"
import { RimFormFields, RimTextField } from "./rim-form-fields"
import type { RimDraft } from "./rim-form.shared"

type RimEditFormProps = {
  rim: RimOption
  onSaved?: () => void
}

const updateRimAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: RimDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateRim(session?.user ?? null, data)
  })

export function hasRimEditChanges(rim: RimOption, draft: RimDraft) {
  const normalizedCurrent = normalizeRimDraft(createRimDraft(rim))
  const normalizedDraft = normalizeRimDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function RimEditForm({ rim, onSaved }: RimEditFormProps) {
  const router = useRouter()
  const updateRim = useServerFn(updateRimAction)
  const [fieldErrors, setFieldErrors] = useState<RimFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createRimDraft(rim),
    validators: { onSubmit: createRimInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateRim({ data: { id: rim.id, ...value } })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createRimDraft(rim))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, rim])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: RimMutationResult) {
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
      id="database-rim-edit-form"
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
            <RimFormFields variant="edit">
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
                      <RimTextField
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
            </RimFormFields>

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
                  state.isSubmitting || !hasRimEditChanges(rim, state.values)
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
