import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { EngraverOption } from "@coin-archive/db"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  EngraverFieldErrors,
  EngraverMutationResult,
} from "../actions"
import {
  getEngraverFieldErrors,
  submitUpdateEngraver,
  updateEngraverInputSchema,
} from "../actions"

import {
  createEngraverDraft,
  normalizeEngraverDraft,
} from "./engraver-form.shared"
import type { EngraverDraft } from "./engraver-form.shared"

type EngraverEditFormProps = {
  engraver: EngraverOption
  onSaved?: () => void
}

const updateEngraverAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: EngraverDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateEngraver(session?.user ?? null, data)
  })

function validateEngraverDraft(
  engraverId: string,
  draft: EngraverDraft
): EngraverMutationResult | null {
  const parsedInput = updateEngraverInputSchema.safeParse({
    id: engraverId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getEngraverFieldErrors(parsedInput.error.issues),
  }
}

export function hasEngraverEditChanges(
  engraver: EngraverOption,
  draft: EngraverDraft
) {
  const normalizedCurrent = normalizeEngraverDraft(createEngraverDraft(engraver))
  const normalizedDraft = normalizeEngraverDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function EngraverEditForm({
  engraver,
  onSaved,
}: EngraverEditFormProps) {
  const router = useRouter()
  const updateEngraver = useServerFn(updateEngraverAction)
  const [draft, setDraft] = useState<EngraverDraft>(
    createEngraverDraft(engraver)
  )
  const [fieldErrors, setFieldErrors] = useState<EngraverFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasChanges = hasEngraverEditChanges(engraver, draft)

  useEffect(() => {
    setDraft(createEngraverDraft(engraver))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [engraver])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: EngraverMutationResult) {
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

    const validationResult = validateEngraverDraft(engraver.id, draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateEngraver({
        data: {
          id: engraver.id,
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
      id="database-engraver-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="engraver-code">Engraver Code</FieldLabel>
          <Input
            id="engraver-code"
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
          <FieldLabel htmlFor="engraver-name">Engraver Name</FieldLabel>
          <Input
            id="engraver-name"
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
      {successMessage ? (
        <p className="text-sm text-emerald-700">{successMessage}</p>
      ) : null}

      <div className="mt-auto flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!hasChanges}
          className="w-full"
        >
          Save
        </SubmitButton>
      </div>
    </form>
  )
}
