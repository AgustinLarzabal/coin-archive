import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { DistributionOption } from "@coin-archive/db"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  DistributionFieldErrors,
  DistributionMutationResult,
} from "../actions"
import {
  createDistributionInputSchema,
  submitUpdateDistribution,
} from "../actions"

import {
  createDistributionDraft,
  normalizeDistributionDraft,
} from "./distribution-form.shared"
import {
  DistributionFormFields,
  DistributionTextField,
} from "./distribution-form-fields"
import type { DistributionDraft } from "./distribution-form.shared"

type DistributionEditFormProps = {
  distribution: DistributionOption
  onSaved?: () => void
}

const updateDistributionAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: DistributionDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateDistribution(session?.user ?? null, data)
  })

export function hasDistributionEditChanges(
  distribution: DistributionOption,
  draft: DistributionDraft
) {
  const normalizedCurrent = normalizeDistributionDraft(
    createDistributionDraft(distribution)
  )
  const normalizedDraft = normalizeDistributionDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function DistributionEditForm({
  distribution,
  onSaved,
}: DistributionEditFormProps) {
  const router = useRouter()
  const updateDistribution = useServerFn(updateDistributionAction)
  const [fieldErrors, setFieldErrors] = useState<DistributionFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createDistributionDraft(distribution),
    validators: { onSubmit: createDistributionInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateDistribution({
        data: { id: distribution.id, ...value },
      })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createDistributionDraft(distribution))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, distribution])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: DistributionMutationResult) {
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
      id="database-distribution-edit-form"
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
            <DistributionFormFields variant="edit">
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
                      <DistributionTextField
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
            </DistributionFormFields>

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
                  !hasDistributionEditChanges(distribution, state.values)
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
