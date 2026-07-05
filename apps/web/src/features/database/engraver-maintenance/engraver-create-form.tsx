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
  EngraverFieldErrors,
  EngraverMutationResult,
} from "./actions"
import {
  createEngraverInputSchema,
  getEngraverFieldErrors,
  submitCreateEngraver,
} from "./actions"

import {
  EMPTY_ENGRAVER_DRAFT,
  isEngraverDraftComplete,
} from "./engraver-form.shared"
import type { EngraverDraft } from "./engraver-form.shared"

type EngraverCreateFormProps = {
  onCreated?: () => void
}

const createEngraverAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: EngraverDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateEngraver(session?.user ?? null, data)
  })

function validateEngraverDraft(
  draft: EngraverDraft
): EngraverMutationResult | null {
  const parsedInput = createEngraverInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getEngraverFieldErrors(parsedInput.error.issues),
  }
}

export function EngraverCreateForm({ onCreated }: EngraverCreateFormProps) {
  const router = useRouter()
  const createEngraver = useServerFn(createEngraverAction)
  const [draft, setDraft] = useState<EngraverDraft>(EMPTY_ENGRAVER_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<EngraverFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: EngraverMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  function updateDraft<TFieldName extends keyof EngraverDraft>(
    field: TFieldName,
    value: EngraverDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateEngraverDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createEngraver({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_ENGRAVER_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-engraver-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="new-engraver-code">Engraver Code</FieldLabel>
          <Input
            id="new-engraver-code"
            name="code"
            value={draft.code}
            onChange={(event) => updateDraft("code", event.target.value)}
            aria-invalid={fieldErrors.code !== undefined}
            placeholder="barth"
            autoComplete="off"
          />
          {fieldErrors.code ? (
            <FieldError errors={[{ message: fieldErrors.code }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.name !== undefined}>
          <FieldLabel htmlFor="new-engraver-name">Engraver Name</FieldLabel>
          <Input
            id="new-engraver-name"
            name="name"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            aria-invalid={fieldErrors.name !== undefined}
            placeholder="Barth"
            autoComplete="off"
          />
          {fieldErrors.name ? (
            <FieldError errors={[{ message: fieldErrors.name }]} />
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
          disabled={!isEngraverDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
