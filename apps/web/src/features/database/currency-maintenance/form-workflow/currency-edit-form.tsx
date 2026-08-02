import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Currency } from "@coin-archive/api"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitUpdateCurrency } from "../actions"
import type { CurrencyMutationResult } from "../actions"
import { createCurrencyInputSchema } from "../validation"
import type { CurrencyFieldErrors } from "../validation"

import {
  createCurrencyDraft,
  normalizeCurrencyDraft,
} from "./currency-form.shared"
import { CurrencyFormFields, CurrencyTextField } from "./currency-form-fields"
import type { CurrencyDraft } from "./currency-form.shared"

type CurrencyEditFormProps = {
  currency: Currency
  onSaved?: () => void
}

const updateCurrencyAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: CurrencyDraft & { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitUpdateCurrency(data))

export function hasCurrencyEditChanges(
  currency: Currency,
  draft: CurrencyDraft
) {
  const normalizedCurrent = normalizeCurrencyDraft(
    createCurrencyDraft(currency)
  )
  const normalizedDraft = normalizeCurrencyDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name ||
    normalizedDraft.fullName !== normalizedCurrent.fullName
  )
}

export function CurrencyEditForm({ currency, onSaved }: CurrencyEditFormProps) {
  const router = useRouter()
  const updateCurrency = useServerFn(updateCurrencyAction)
  const [fieldErrors, setFieldErrors] = useState<CurrencyFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createCurrencyDraft(currency),
    validators: { onSubmit: createCurrencyInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateCurrency({
        data: { id: currency.id, etag: currency.etag, ...value },
      })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createCurrencyDraft(currency))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, currency])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: CurrencyMutationResult) {
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
      id="database-currency-edit-form"
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
            <CurrencyFormFields variant="edit">
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
                      <CurrencyTextField
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
            </CurrencyFormFields>

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
                  !hasCurrencyEditChanges(currency, state.values)
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
