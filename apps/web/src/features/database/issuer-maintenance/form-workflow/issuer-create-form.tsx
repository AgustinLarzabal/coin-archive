import { useMemo, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "../issuer-maintenance-route-data"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitCreateIssuer } from "../actions"
import type { IssuerMutationResult } from "../actions"
import type { IssuerFieldErrors } from "../validation"
import {
  EMPTY_ISSUER_DRAFT,
  getCreateIssuerSubmission,
  getParentIssuerOptions,
  isIssuerDraftComplete,
} from "./issuer-form.shared"
import { IssuerFormFields, IssuerTextField } from "./issuer-form-fields"

type IssuerCreateFormProps = {
  issuers: IssuerMaintenanceRecord[]
  onCreated?: () => void
}

const createIssuerAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: {
      code: string
      isoCode: string
      name: string
      parentIssuerId: string | null
      idempotencyKey: string
    }) => data
  )
  .handler(async ({ data }) => submitCreateIssuer(data))

export function IssuerCreateForm({
  issuers,
  onCreated,
}: IssuerCreateFormProps) {
  const router = useRouter()
  const createIssuer = useServerFn(createIssuerAction)
  const [fieldErrors, setFieldErrors] = useState<IssuerFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  )
  const parentIssuerOptions = useMemo(
    () => getParentIssuerOptions(issuers),
    [issuers]
  )

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: IssuerMutationResult) {
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
    defaultValues: EMPTY_ISSUER_DRAFT,
    onSubmit: async ({ value }) => {
      const submission = getCreateIssuerSubmission(value, issuers)

      if (submission.status === "invalid") {
        applyResult(submission.result)
        return
      }

      const result = await createIssuer({
        data: { ...submission.data, idempotencyKey },
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
      id="database-issuer-create-form"
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
            <IssuerFormFields
              parentIssuerOptions={parentIssuerOptions}
              parentIssuerOptionsListId="issuer-parent-options-create"
              variant="create"
            >
              {(config) => (
                <form.Field key={config.field} name={config.field}>
                  {(field) => {
                    const serverError = fieldErrors[config.errorField]
                    const isInvalid = serverError !== undefined
                    return (
                      <IssuerTextField
                        {...config}
                        errors={serverError ? [{ message: serverError }] : []}
                        isInvalid={isInvalid}
                        onBlur={field.handleBlur}
                        onChange={field.handleChange}
                        value={field.state.value}
                      />
                    )
                  }}
                </form.Field>
              )}
            </IssuerFormFields>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting || !isIssuerDraftComplete(state.values)
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
