import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CurrencyOption } from "@workspace/db"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  CurrencyFieldErrors,
  CurrencyMutationResult,
} from "@/lib/currency-maintenance"
import {
  getCurrencyFieldErrors,
  submitUpdateCurrency,
  updateCurrencyInputSchema,
} from "@/lib/currency-maintenance"

type CurrencyDraft = {
  code: string
  name: string
  fullName: string
}

type CurrencyEditFormProps = {
  currency: CurrencyOption
  onSaved?: () => void
}

const updateCurrencyAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: CurrencyDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateCurrency(session?.user ?? null, data)
  })

function validateCurrencyDraft(
  currencyId: string,
  draft: CurrencyDraft
): CurrencyMutationResult | null {
  const parsedInput = updateCurrencyInputSchema.safeParse({
    id: currencyId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getCurrencyFieldErrors(parsedInput.error.issues),
  }
}

function createCurrencyDraft(currency: CurrencyOption): CurrencyDraft {
  return {
    code: currency.code,
    name: currency.name,
    fullName: currency.fullName,
  }
}

function normalizeDraftForComparison(draft: CurrencyDraft): CurrencyDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
    fullName: draft.fullName.trim(),
  }
}

export function hasCurrencyEditChanges(
  currency: CurrencyOption,
  draft: CurrencyDraft
) {
  const normalizedCurrent = normalizeDraftForComparison(
    createCurrencyDraft(currency)
  )
  const normalizedDraft = normalizeDraftForComparison(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name ||
    normalizedDraft.fullName !== normalizedCurrent.fullName
  )
}

export function CurrencyEditForm({ currency, onSaved }: CurrencyEditFormProps) {
  const router = useRouter()
  const updateCurrency = useServerFn(updateCurrencyAction)
  const [draft, setDraft] = useState<CurrencyDraft>(createCurrencyDraft(currency))
  const [fieldErrors, setFieldErrors] = useState<CurrencyFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setDraft(createCurrencyDraft(currency))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [currency])

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

  function updateDraft<FieldName extends keyof CurrencyDraft>(
    field: FieldName,
    value: CurrencyDraft[FieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateCurrencyDraft(currency.id, draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateCurrency({
        data: {
          id: currency.id,
          ...draft,
        },
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-currency-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="currency-code">Currency Code</FieldLabel>
          <Input
            id="currency-code"
            name="code"
            value={draft.code}
            onChange={(event) => updateDraft("code", event.target.value)}
            aria-invalid={fieldErrors.code !== undefined}
            placeholder="united-states-dollar"
            autoComplete="off"
          />
          {fieldErrors.code ? (
            <FieldError errors={[{ message: fieldErrors.code }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.name !== undefined}>
          <FieldLabel htmlFor="currency-name">Currency Name</FieldLabel>
          <Input
            id="currency-name"
            name="name"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            aria-invalid={fieldErrors.name !== undefined}
            placeholder="Dollar"
            autoComplete="off"
          />
          {fieldErrors.name ? (
            <FieldError errors={[{ message: fieldErrors.name }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.fullName !== undefined}>
          <FieldLabel htmlFor="currency-full-name">Currency Full Name</FieldLabel>
          <Input
            id="currency-full-name"
            name="fullName"
            value={draft.fullName}
            onChange={(event) => updateDraft("fullName", event.target.value)}
            aria-invalid={fieldErrors.fullName !== undefined}
            placeholder="United States dollar"
            autoComplete="off"
          />
          {fieldErrors.fullName ? (
            <FieldError errors={[{ message: fieldErrors.fullName }]} />
          ) : null}
        </Field>
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
          isSubmitting={isPending}
          disabled={!hasCurrencyEditChanges(currency, draft)}
          className="w-full"
        >
          Save
        </SubmitButton>
      </div>
    </form>
  )
}
