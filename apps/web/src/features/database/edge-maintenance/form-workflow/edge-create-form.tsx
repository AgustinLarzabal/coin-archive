import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitCreateEdge } from "../actions"
import type { EdgeMutationResult } from "../edge-mutation-errors"
import type { EdgeFieldErrors } from "../edge-validation"

import { EdgeFormFields } from "./edge-form-fields"
import {
  EMPTY_EDGE_DRAFT,
  isEdgeDraftComplete,
  validateEdgeCreateDraft,
} from "./edge-form.shared"
import type { EdgeDraft } from "./edge-form.shared"

type EdgeCreateFormProps = {
  onCreated?: () => void
}

const createEdgeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: EdgeDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateEdge(session?.user ?? null, data)
  })

export function EdgeCreateForm({ onCreated }: EdgeCreateFormProps) {
  const router = useRouter()
  const createEdge = useServerFn(createEdgeAction)
  const [draft, setDraft] = useState<EdgeDraft>(EMPTY_EDGE_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<EdgeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: EdgeMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  function updateDraft<TFieldName extends keyof EdgeDraft>(
    field: TFieldName,
    value: EdgeDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateEdgeCreateDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createEdge({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_EDGE_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-edge-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <EdgeFormFields
        draft={draft}
        fieldErrors={fieldErrors}
        onFieldChange={updateDraft}
        variant="create"
      />

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}

      <div className="mt-auto flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!isEdgeDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
