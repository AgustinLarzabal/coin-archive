import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { ThemeOption } from "@workspace/db"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  ThemeFieldErrors,
  ThemeMutationResult,
} from "@/lib/theme-maintenance"
import {
  getThemeFieldErrors,
  submitUpdateTheme,
  updateThemeInputSchema,
} from "@/lib/theme-maintenance"

import { createThemeDraft, normalizeThemeDraft } from "./theme-form.shared"
import { ThemeFormFields } from "./theme-form-fields"
import type { ThemeDraft } from "./theme-form.shared"

type ThemeEditFormProps = {
  theme: ThemeOption
  onSaved?: (message: string) => void
}

const updateThemeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: ThemeDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateTheme(session?.user ?? null, data)
  })

function validateUpdateThemeDraft(
  themeId: string,
  draft: ThemeDraft
): ThemeMutationResult | null {
  const parsedInput = updateThemeInputSchema.safeParse({
    id: themeId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getThemeFieldErrors(parsedInput.error.issues),
  }
}

export function hasThemeEditChanges(theme: ThemeOption, draft: ThemeDraft) {
  const normalizedCurrent = normalizeThemeDraft(createThemeDraft(theme))
  const normalizedDraft = normalizeThemeDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function ThemeEditForm({ theme, onSaved }: ThemeEditFormProps) {
  const router = useRouter()
  const updateTheme = useServerFn(updateThemeAction)
  const [draft, setDraft] = useState<ThemeDraft>(createThemeDraft(theme))
  const [fieldErrors, setFieldErrors] = useState<ThemeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasChanges = hasThemeEditChanges(theme, draft)

  useEffect(() => {
    setDraft(createThemeDraft(theme))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [theme])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: ThemeMutationResult): string | null {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      setSuccessMessage(result.message)
      return result.message
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    setSuccessMessage(null)
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

    const validationResult = validateUpdateThemeDraft(theme.id, draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateTheme({
        data: {
          id: theme.id,
          ...draft,
        },
      })
      const successMessage = applyResult(result)

      if (successMessage !== null) {
        await router.invalidate()
        onSaved?.(successMessage)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-theme-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <ThemeFormFields
        codeInputId="theme-code"
        nameInputId="theme-name"
        codePlaceholder="map"
        namePlaceholder="Map"
        draft={draft}
        fieldErrors={fieldErrors}
        onDraftChange={updateDraft}
      />

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
