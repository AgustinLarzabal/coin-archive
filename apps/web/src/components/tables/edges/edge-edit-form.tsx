import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { EdgeOption } from "@workspace/db"
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
  EdgeFieldErrors,
  EdgeMutationResult,
} from "@/lib/edge-maintenance"
import {
  getEdgeFieldErrors,
  submitUpdateEdge,
  updateEdgeInputSchema,
} from "@/lib/edge-maintenance"

import { createEdgeDraft, normalizeEdgeDraft } from "./edge-form.shared"
import type { EdgeDraft } from "./edge-form.shared"

type EdgeEditFormProps = {
  edge: EdgeOption
  onSaved?: () => void
}

const updateEdgeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: EdgeDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateEdge(session?.user ?? null, data)
  })

function validateUpdateEdgeDraft(
  edgeId: string,
  draft: EdgeDraft
): EdgeMutationResult | null {
  const parsedInput = updateEdgeInputSchema.safeParse({
    id: edgeId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getEdgeFieldErrors(parsedInput.error.issues),
  }
}

export function hasEdgeEditChanges(edge: EdgeOption, draft: EdgeDraft) {
  const normalizedCurrent = normalizeEdgeDraft(createEdgeDraft(edge))
  const normalizedDraft = normalizeEdgeDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function EdgeEditForm({ edge, onSaved }: EdgeEditFormProps) {
  const router = useRouter()
  const updateEdge = useServerFn(updateEdgeAction)
  const [draft, setDraft] = useState<EdgeDraft>(createEdgeDraft(edge))
  const [fieldErrors, setFieldErrors] = useState<EdgeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasChanges = hasEdgeEditChanges(edge, draft)

  useEffect(() => {
    setDraft(createEdgeDraft(edge))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [edge])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: EdgeMutationResult) {
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

    const validationResult = validateUpdateEdgeDraft(edge.id, draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateEdge({
        data: {
          id: edge.id,
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
      id="database-edge-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="edge-code">Edge Code</FieldLabel>
          <Input
            id="edge-code"
            name="code"
            value={draft.code}
            onChange={(event) => updateDraft("code", event.target.value)}
            aria-invalid={fieldErrors.code !== undefined}
            placeholder="reeded"
            autoComplete="off"
          />
          {fieldErrors.code ? (
            <FieldError errors={[{ message: fieldErrors.code }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.name !== undefined}>
          <FieldLabel htmlFor="edge-name">Edge Name</FieldLabel>
          <Input
            id="edge-name"
            name="name"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            aria-invalid={fieldErrors.name !== undefined}
            placeholder="Reeded"
            autoComplete="off"
          />
          {fieldErrors.name ? (
            <FieldError errors={[{ message: fieldErrors.name }]} />
          ) : null}
        </Field>
      </FieldGroup>

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
