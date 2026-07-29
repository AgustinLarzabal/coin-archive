import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RulerGroupOption, RulerOption } from "@coin-archive/db"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitUpdateRuler } from "../actions"

import { RulerFormFields } from "./ruler-form-fields"
import {
  createRulerDraft,
  getRulerGroupSelectionOptions,
  getUpdateRulerSubmission,
  normalizeRulerDraft,
} from "./ruler-form.shared"
import type { RulerDraft } from "./ruler-form.shared"
import { useRulerFormFeedback } from "./use-ruler-form-feedback"

type RulerEditFormProps = {
  ruler: RulerOption
  rulerGroups: RulerGroupOption[]
  onSaved?: () => void
}

const updateRulerAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: {
    id: string
    code: string
    name: string
    rulerGroupId: string | null
  }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateRuler(session?.user ?? null, data)
  })

export function hasRulerEditChanges(ruler: RulerOption, draft: RulerDraft) {
  const normalizedCurrent = normalizeRulerDraft(createRulerDraft(ruler))
  const normalizedDraft = normalizeRulerDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name ||
    normalizedDraft.rulerGroupLabel !== normalizedCurrent.rulerGroupLabel
  )
}

export function RulerEditForm({
  ruler,
  rulerGroups,
  onSaved,
}: RulerEditFormProps) {
  const router = useRouter()
  const updateRuler = useServerFn(updateRulerAction)
  const [draft, setDraft] = useState<RulerDraft>(createRulerDraft(ruler))
  const [isPending, setIsPending] = useState(false)
  const {
    fieldErrors,
    formError,
    successMessage,
    clearFeedback,
    applyResult,
  } = useRulerFormFeedback()
  const rulerGroupOptions = getRulerGroupSelectionOptions(rulerGroups)
  const hasChanges = hasRulerEditChanges(ruler, draft)

  useEffect(() => {
    setDraft(createRulerDraft(ruler))
    clearFeedback()
  }, [ruler, clearFeedback])

  function updateDraft<TFieldName extends keyof RulerDraft>(
    field: TFieldName,
    value: RulerDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const submission = getUpdateRulerSubmission(ruler.id, draft, rulerGroups)

    if (submission.status === "invalid") {
      applyResult(submission.result)
      return
    }

    setIsPending(true)

    try {
      const result = await updateRuler({
        data: submission.data,
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
      id="database-ruler-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <RulerFormFields
        codeInputId="ruler-code"
        nameInputId="ruler-name"
        rulerGroupInputId="ruler-group"
        rulerGroupOptionsListId="ruler-group-options-edit"
        codePlaceholder="felipe-v"
        namePlaceholder="Felipe V"
        rulerGroupPlaceholder="House of Bourbon (house-of-bourbon)"
        draft={draft}
        fieldErrors={fieldErrors}
        rulerGroupOptions={rulerGroupOptions}
        onDraftChange={updateDraft}
      />

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
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
