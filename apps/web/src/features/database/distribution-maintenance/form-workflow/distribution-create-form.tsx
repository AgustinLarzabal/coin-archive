import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  DistributionFieldErrors,
  DistributionMutationResult,
} from "../actions"
import {
  createDistributionInputSchema,
  submitCreateDistribution,
} from "../actions"

import {
  EMPTY_DISTRIBUTION_DRAFT,
  isDistributionDraftComplete,
} from "./distribution-form.shared"
import {
  DistributionFormFields,
  DistributionTextField,
} from "./distribution-form-fields"
import type { DistributionDraft } from "./distribution-form.shared"

type DistributionCreateFormProps = {
  onCreated?: () => void
}

const createDistributionAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: DistributionDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateDistribution(session?.user ?? null, data)
  })

export function DistributionCreateForm({
  onCreated,
}: DistributionCreateFormProps) {
  const router = useRouter()
  const createDistribution = useServerFn(createDistributionAction)
  const [fieldErrors, setFieldErrors] = useState<DistributionFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: DistributionMutationResult) {
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
    defaultValues: EMPTY_DISTRIBUTION_DRAFT,
    validators: { onSubmit: createDistributionInputSchema },
    onSubmit: async ({ value }) => {
      const result = await createDistribution({
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
      id="database-distribution-create-form"
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
            <DistributionFormFields variant="create">
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

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !isDistributionDraftComplete(state.values)
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
