import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type { RimFieldErrors, RimMutationResult } from "../actions"
import { createRimInputSchema, submitCreateRim } from "../actions"

import { EMPTY_RIM_DRAFT, isRimDraftComplete } from "./rim-form.shared"
import { RimFormFields, RimTextField } from "./rim-form-fields"
import type { RimDraft } from "./rim-form.shared"

type RimCreateFormProps = {
  onCreated?: () => void
}

const createRimAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: RimDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateRim(session?.user ?? null, data)
  })

export function RimCreateForm({ onCreated }: RimCreateFormProps) {
  const router = useRouter()
  const createRim = useServerFn(createRimAction)
  const [fieldErrors, setFieldErrors] = useState<RimFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: RimMutationResult) {
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
    defaultValues: EMPTY_RIM_DRAFT,
    validators: { onSubmit: createRimInputSchema },
    onSubmit: async ({ value }) => {
      const result = await createRim({
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
      id="database-rim-create-form"
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
            <RimFormFields variant="create">
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

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting || !isRimDraftComplete(state.values)
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
