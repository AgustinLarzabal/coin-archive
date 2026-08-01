import { useEffect, useMemo, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "@coin-archive/db"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"

import { submitUpdateIssuer } from "../actions"
import type { IssuerMutationResult } from "../actions"
import type { IssuerFieldErrors } from "../validation"
import {
  createIssuerDraft,
  getParentIssuerOptions,
  getUpdateIssuerSubmission,
  normalizeIssuerDraft,
} from "./issuer-form.shared"
import type { IssuerDraft } from "./issuer-form.shared"
import { IssuerFormFields, IssuerTextField } from "./issuer-form-fields"

type IssuerEditFormProps = {
  issuer: IssuerMaintenanceRecord
  issuers: IssuerMaintenanceRecord[]
  onSaved?: () => void
}

const updateIssuerAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: {
      id: string
      code: string
      isoCode: string
      name: string
      parentIssuerId: string | null
    }) => data
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateIssuer(session?.user ?? null, data)
  })

export function hasIssuerEditChanges(
  issuer: IssuerMaintenanceRecord,
  issuers: IssuerMaintenanceRecord[],
  draft: IssuerDraft
): boolean {
  const normalizedCurrent = normalizeIssuerDraft(
    createIssuerDraft(issuer, issuers)
  )
  const normalizedDraft = normalizeIssuerDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.isoCode !== normalizedCurrent.isoCode ||
    normalizedDraft.name !== normalizedCurrent.name ||
    normalizedDraft.parentIssuerLabel !== normalizedCurrent.parentIssuerLabel
  )
}

export function IssuerEditForm({
  issuer,
  issuers,
  onSaved,
}: IssuerEditFormProps) {
  const router = useRouter()
  const updateIssuer = useServerFn(updateIssuerAction)
  const [fieldErrors, setFieldErrors] = useState<IssuerFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const parentIssuerOptions = useMemo(
    () => getParentIssuerOptions(issuers, issuer.id),
    [issuer.id, issuers]
  )

  const form = useForm({
    defaultValues: createIssuerDraft(issuer, issuers),
    onSubmit: async ({ value }) => {
      const submission = getUpdateIssuerSubmission(issuer.id, value, issuers)
      if (submission.status === "invalid") {
        applyResult(submission.result)
        return
      }
      const result = await updateIssuer({ data: submission.data })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createIssuerDraft(issuer, issuers))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, issuer, issuers])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: IssuerMutationResult) {
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
      id="database-issuer-edit-form"
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
              parentIssuerOptionsListId="issuer-parent-options-edit"
              variant="edit"
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
            {successMessage ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !hasIssuerEditChanges(issuer, issuers, state.values)
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
