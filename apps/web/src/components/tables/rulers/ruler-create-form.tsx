import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RulerGroupOption } from "@workspace/db"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  RulerFieldErrors,
  RulerMutationResult,
} from "@/lib/ruler-maintenance"
import { submitCreateRuler } from "@/lib/ruler-maintenance"

import { RulerFormFields } from "./ruler-form-fields"
import {
  EMPTY_RULER_DRAFT,
  getCreateRulerSubmission,
  isRulerDraftComplete,
} from "./ruler-form.shared"
import type { RulerDraft } from "./ruler-form.shared"

type RulerCreateFormProps = {
  rulerGroups: RulerGroupOption[]
  onCreated?: () => void
}

const createRulerAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: { code: string; name: string; rulerGroupId: string | null }) => data
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateRuler(session?.user ?? null, data)
  })

export function RulerCreateForm({
  rulerGroups,
  onCreated,
}: RulerCreateFormProps) {
  const router = useRouter()
  const createRuler = useServerFn(createRulerAction)
  const [draft, setDraft] = useState<RulerDraft>(EMPTY_RULER_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<RulerFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: RulerMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

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

    const submission = getCreateRulerSubmission(draft, rulerGroups)

    if (submission.status === "invalid") {
      applyResult(submission.result)
      return
    }

    setIsPending(true)

    try {
      const result = await createRuler({
        data: submission.data,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_RULER_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-ruler-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <RulerFormFields
        codeInputId="new-ruler-code"
        nameInputId="new-ruler-name"
        rulerGroupInputId="new-ruler-group"
        rulerGroupOptionsId="ruler-group-options-create"
        codePlaceholder="louis-xiv"
        namePlaceholder="Louis XIV"
        rulerGroupPlaceholder="Search Ruler Group..."
        draft={draft}
        rulerGroups={rulerGroups}
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
          disabled={!isRulerDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
