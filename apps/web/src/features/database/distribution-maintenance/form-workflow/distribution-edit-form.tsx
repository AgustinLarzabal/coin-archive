import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Distribution } from "@coin-archive/api"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitUpdateDistribution } from "../actions"
import type { DistributionMutationResult } from "../actions"
import { createDistributionInputSchema } from "../validation"
import type { DistributionFieldErrors } from "../validation"

type DistributionDraft = {
  code: string
  name: string
}

type DistributionEditFormProps = {
  distribution: Distribution
  onSaved?: () => void
}

const updateDistributionAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: DistributionDraft & { id: string; etag: string }) => data
  )
  .handler(async ({ data }) => submitUpdateDistribution(data))

function createDistributionDraft(
  distribution: Distribution
): DistributionDraft {
  return {
    code: distribution.code,
    name: distribution.name,
  }
}

function normalizeDraftForComparison(
  draft: DistributionDraft
): DistributionDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function hasDistributionEditChanges(
  distribution: Distribution,
  draft: DistributionDraft
) {
  const normalizedCurrent = normalizeDraftForComparison(
    createDistributionDraft(distribution)
  )
  const normalizedDraft = normalizeDraftForComparison(draft)

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
        data: { id: distribution.id, etag: distribution.etag, ...value },
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
  }, [distribution, form])

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
            <FieldGroup>
              {(
                [
                  {
                    name: "code",
                    id: "distribution-code",
                    label: "Distribution Code",
                    placeholder: "silver",
                  },
                  {
                    name: "name",
                    id: "distribution-name",
                    label: "Distribution Name",
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
