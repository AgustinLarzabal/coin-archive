import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
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
} from "../actions"
import {
  createCurrencyInputSchema,
  getCurrencyFieldErrors,
  submitCreateCurrency,
} from "../actions"

import {
  EMPTY_CURRENCY_DRAFT,
  isCurrencyDraftComplete,
} from "./currency-form.shared"
import type { CurrencyDraft } from "./currency-form.shared"

type CurrencyCreateFormProps = {
  onCreated?: () => void
}

const createCurrencyAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: CurrencyDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateCurrency(session?.user ?? null, data)
  })

function validateCurrencyDraft(
  draft: CurrencyDraft
): CurrencyMutationResult | null {
  const parsedInput = createCurrencyInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getCurrencyFieldErrors(parsedInput.error.issues),
  }
}

export function CurrencyCreateForm({ onCreated }: CurrencyCreateFormProps) {
  const router = useRouter()
  const createCurrency = useServerFn(createCurrencyAction)
  const [draft, setDraft] = useState<CurrencyDraft>(EMPTY_CURRENCY_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<CurrencyFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: CurrencyMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  function updateDraft<TFieldName extends keyof CurrencyDraft>(
    field: TFieldName,
    value: CurrencyDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateCurrencyDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createCurrency({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_CURRENCY_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-currency-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="new-currency-code">Currency Code</FieldLabel>
          <Input
            id="new-currency-code"
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
          <FieldLabel htmlFor="new-currency-name">Currency Name</FieldLabel>
          <Input
            id="new-currency-name"
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
          <FieldLabel htmlFor="new-currency-full-name">
            Currency Full Name
          </FieldLabel>
          <Input
            id="new-currency-full-name"
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

      <div className="mt-auto flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!isCurrencyDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
