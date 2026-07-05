import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  ShapeFieldErrors,
  ShapeMutationResult,
} from "../actions"
import {
  createShapeInputSchema,
  getShapeFieldErrors,
  submitCreateShape,
} from "../actions"

import { ShapeFormFields } from "./shape-form-fields"
import { EMPTY_SHAPE_DRAFT, isShapeDraftComplete } from "./shape-form.shared"
import type { ShapeDraft } from "./shape-form.shared"

type ShapeCreateFormProps = {
  onCreated?: () => void
}

const createShapeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: ShapeDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateShape(session?.user ?? null, data)
  })

function validateShapeDraft(draft: ShapeDraft): ShapeMutationResult | null {
  const parsedInput = createShapeInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getShapeFieldErrors(parsedInput.error.issues),
  }
}

export function ShapeCreateForm({ onCreated }: ShapeCreateFormProps) {
  const router = useRouter()
  const createShape = useServerFn(createShapeAction)
  const [draft, setDraft] = useState<ShapeDraft>(EMPTY_SHAPE_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<ShapeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: ShapeMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  function updateDraft<TFieldName extends keyof ShapeDraft>(
    field: TFieldName,
    value: ShapeDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateShapeDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createShape({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_SHAPE_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-shape-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <ShapeFormFields
        codeInputId="new-shape-code"
        nameInputId="new-shape-name"
        codePlaceholder="round"
        namePlaceholder="Round"
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
          disabled={!isShapeDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
