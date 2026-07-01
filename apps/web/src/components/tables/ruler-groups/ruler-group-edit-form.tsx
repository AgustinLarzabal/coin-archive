import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RulerGroupOption } from "@workspace/db"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  RulerGroupFieldErrors,
  RulerGroupMutationResult,
} from "@/lib/ruler-group-maintenance"
import {
  getRulerGroupFieldErrors,
  submitUpdateRulerGroup,
  updateRulerGroupInputSchema,
} from "@/lib/ruler-group-maintenance"

import { RulerGroupFormFields } from "./ruler-group-form-fields"
import {
  createRulerGroupDraft,
  normalizeRulerGroupDraft,
} from "./ruler-group-form.shared"
import type { RulerGroupDraft } from "./ruler-group-form.shared"

type RulerGroupEditFormProps = {
  rulerGroup: RulerGroupOption
  onSaved?: () => void
}

const updateRulerGroupAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: RulerGroupDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateRulerGroup(session?.user ?? null, data)
  })

function validateUpdateRulerGroupDraft(
  rulerGroupId: string,
  draft: RulerGroupDraft
): RulerGroupMutationResult | null {
  const parsedInput = updateRulerGroupInputSchema.safeParse({
    id: rulerGroupId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getRulerGroupFieldErrors(parsedInput.error.issues),
  }
}

export function hasRulerGroupEditChanges(
  rulerGroup: RulerGroupOption,
  draft: RulerGroupDraft
) {
  const normalizedCurrent = normalizeRulerGroupDraft(
    createRulerGroupDraft(rulerGroup)
  )
  const normalizedDraft = normalizeRulerGroupDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function RulerGroupEditForm({
  rulerGroup,
  onSaved,
}: RulerGroupEditFormProps) {
  const router = useRouter()
  const updateRulerGroup = useServerFn(updateRulerGroupAction)
  const [draft, setDraft] = useState<RulerGroupDraft>(
    createRulerGroupDraft(rulerGroup)
  )
  const [fieldErrors, setFieldErrors] = useState<RulerGroupFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasChanges = hasRulerGroupEditChanges(rulerGroup, draft)

  useEffect(() => {
    setDraft(createRulerGroupDraft(rulerGroup))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [rulerGroup])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: RulerGroupMutationResult) {
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

  function updateDraft<TFieldName extends keyof RulerGroupDraft>(
    field: TFieldName,
    value: RulerGroupDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateUpdateRulerGroupDraft(rulerGroup.id, draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateRulerGroup({
        data: {
          id: rulerGroup.id,
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
      id="database-ruler-group-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <RulerGroupFormFields
        codeInputId="ruler-group-code"
        nameInputId="ruler-group-name"
        codePlaceholder="house-of-bourbon"
        namePlaceholder="House of Bourbon"
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
