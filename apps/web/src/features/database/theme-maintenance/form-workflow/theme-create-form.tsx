import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  ThemeFieldErrors,
  ThemeMutationResult,
} from "../actions"
import {
  createThemeInputSchema,
  getThemeFieldErrors,
  submitCreateTheme,
} from "../actions"

import { EMPTY_THEME_DRAFT, isThemeDraftComplete } from "./theme-form.shared"
import { ThemeFormFields } from "./theme-form-fields"
import type { ThemeDraft } from "./theme-form.shared"

type ThemeCreateFormProps = {
  onCreated?: (message: string) => void
}

const createThemeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: ThemeDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateTheme(session?.user ?? null, data)
  })

function validateThemeDraft(draft: ThemeDraft): ThemeMutationResult | null {
  const parsedInput = createThemeInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getThemeFieldErrors(parsedInput.error.issues),
  }
}

export function ThemeCreateForm({ onCreated }: ThemeCreateFormProps) {
  const router = useRouter()
  const createTheme = useServerFn(createThemeAction)
  const [draft, setDraft] = useState<ThemeDraft>(EMPTY_THEME_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<ThemeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: ThemeMutationResult): string | null {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return result.message
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return null
  }

  function updateDraft<TFieldName extends keyof ThemeDraft>(
    field: TFieldName,
    value: ThemeDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateThemeDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createTheme({
        data: draft,
      })
      const successMessage = applyResult(result)

      if (successMessage !== null) {
        setDraft(EMPTY_THEME_DRAFT)
        await router.invalidate()
        onCreated?.(successMessage)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-theme-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <ThemeFormFields
        codeInputId="new-theme-code"
        nameInputId="new-theme-name"
        codePlaceholder="map"
        namePlaceholder="Map"
        draft={draft}
        fieldErrors={fieldErrors}
        onDraftChange={updateDraft}
      />

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}

      <div className="mt-auto flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!isThemeDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
