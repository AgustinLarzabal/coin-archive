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

import { submitCreateDistribution } from "../actions"
import type { DistributionMutationResult } from "../actions"
import { createDistributionInputSchema } from "../validation"
import type { DistributionFieldErrors } from "../validation"

type DistributionDraft = {
  code: string
  name: string
}

type DistributionCreateFormProps = {
  onCreated?: () => void
}

const EMPTY_DRAFT: DistributionDraft = {
  code: "",
  name: "",
}

const createDistributionAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: DistributionDraft & { idempotencyKey: string }) => data
  )
  .handler(async ({ data }) => submitCreateDistribution(data))

export function isDistributionCreateReady(draft: DistributionDraft) {
  return draft.code.trim().length > 0 && draft.name.trim().length > 0
}

export function DistributionCreateForm({
  onCreated,
}: DistributionCreateFormProps) {
  const router = useRouter()
  const createDistribution = useServerFn(createDistributionAction)
  const [fieldErrors, setFieldErrors] = useState<DistributionFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  )

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
    defaultValues: EMPTY_DRAFT,
    validators: { onSubmit: createDistributionInputSchema },
    onSubmit: async ({ value }) => {
      const result = await createDistribution({
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
            <FieldGroup>
              {(
                [
                  {
                    name: "code",
                    id: "new-distribution-code",
                    label: "Distribution Code",
                    placeholder: "silver",
                  },
                  {
                    name: "name",
                    id: "new-distribution-name",
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

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting || !isDistributionCreateReady(state.values)
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
