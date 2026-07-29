import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { ShapeOption } from "@coin-archive/db"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  ShapeFieldErrors,
  ShapeMutationResult,
} from "../actions"
import {
  getShapeFieldErrors,
  submitUpdateShape,
  updateShapeInputSchema,
} from "../actions"

import { ShapeFormFields } from "./shape-form-fields"
import { createShapeDraft, normalizeShapeDraft } from "./shape-form.shared"
import type { ShapeDraft } from "./shape-form.shared"

type ShapeEditFormProps = {
  shape: ShapeOption
  onSaved?: () => void
}

const updateShapeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: ShapeDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateShape(session?.user ?? null, data)
  })

function validateUpdateShapeDraft(
  shapeId: string,
  draft: ShapeDraft
): ShapeMutationResult | null {
  const parsedInput = updateShapeInputSchema.safeParse({
    id: shapeId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getShapeFieldErrors(parsedInput.error.issues),
  }
}

export function hasShapeEditChanges(shape: ShapeOption, draft: ShapeDraft) {
  const normalizedCurrent = normalizeShapeDraft(createShapeDraft(shape))
  const normalizedDraft = normalizeShapeDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function ShapeEditForm({ shape, onSaved }: ShapeEditFormProps) {
  const router = useRouter()
  const updateShape = useServerFn(updateShapeAction)
  const [draft, setDraft] = useState<ShapeDraft>(createShapeDraft(shape))
  const [fieldErrors, setFieldErrors] = useState<ShapeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasChanges = hasShapeEditChanges(shape, draft)

  useEffect(() => {
    setDraft(createShapeDraft(shape))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [shape])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: ShapeMutationResult) {
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

    const validationResult = validateUpdateShapeDraft(shape.id, draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateShape({
        data: {
          id: shape.id,
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
      id="database-shape-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <ShapeFormFields
        codeInputId="shape-code"
        nameInputId="shape-name"
        codePlaceholder="round"
        namePlaceholder="Round"
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
