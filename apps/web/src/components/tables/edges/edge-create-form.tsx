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
  EdgeFieldErrors,
  EdgeMutationResult,
} from "@/lib/edge-maintenance"
import {
  createEdgeInputSchema,
  getEdgeFieldErrors,
  submitCreateEdge,
} from "@/lib/edge-maintenance"

import { EMPTY_EDGE_DRAFT, isEdgeDraftComplete } from "./edge-form.shared"
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

function validateEdgeDraft(draft: EdgeDraft): EdgeMutationResult | null {
  const parsedInput = createEdgeInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getEdgeFieldErrors(parsedInput.error.issues),
  }
}

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

    const validationResult = validateEdgeDraft(draft)

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
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="new-edge-code">Edge Code</FieldLabel>
          <Input
            id="new-edge-code"
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
          <FieldLabel htmlFor="new-edge-name">Edge Name</FieldLabel>
          <Input
            id="new-edge-name"
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
