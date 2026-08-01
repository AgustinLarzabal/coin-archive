import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { OrientationOption } from "@coin-archive/db"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitUpdateOrientation } from "../actions"
import type { OrientationMutationResult } from "../orientation-mutation-errors"
import type { OrientationFieldErrors } from "../orientation-validation"

import {
  createOrientationDraft,
  hasOrientationEditChanges,
  validateOrientationUpdateDraft,
} from "./orientation-form.shared"
import { OrientationFormFields } from "./orientation-form-fields"
import type { OrientationDraft } from "./orientation-form.shared"

type OrientationEditFormProps = {
  orientation: OrientationOption
  onSaved?: () => void
}

const updateOrientationAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: OrientationDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateOrientation(session?.user ?? null, data)
  })

export function OrientationEditForm({
  orientation,
  onSaved,
}: OrientationEditFormProps) {
  const router = useRouter()
  const updateOrientation = useServerFn(updateOrientationAction)
  const [draft, setDraft] = useState<OrientationDraft>(
    createOrientationDraft(orientation)
  )
  const [fieldErrors, setFieldErrors] = useState<OrientationFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasChanges = hasOrientationEditChanges(orientation, draft)

  useEffect(() => {
    setDraft(createOrientationDraft(orientation))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [orientation])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: OrientationMutationResult) {
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

  function updateDraft<TFieldName extends keyof OrientationDraft>(
    field: TFieldName,
    value: OrientationDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateOrientationUpdateDraft(
      orientation.id,
      draft
    )

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateOrientation({
        data: {
          id: orientation.id,
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
      id="database-orientation-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <OrientationFormFields
        draft={draft}
        fieldErrors={fieldErrors}
        onFieldChange={updateDraft}
        variant="edit"
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
