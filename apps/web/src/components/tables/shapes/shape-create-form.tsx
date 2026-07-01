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
  ShapeFieldErrors,
  ShapeMutationResult,
} from "@/lib/shape-maintenance"
import {
  createShapeInputSchema,
  getShapeFieldErrors,
  submitCreateShape,
} from "@/lib/shape-maintenance"

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

  function updateDraft<FieldName extends keyof ShapeDraft>(
    field: FieldName,
    value: ShapeDraft[FieldName]
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
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="new-shape-code">Shape Code</FieldLabel>
          <Input
            id="new-shape-code"
            name="code"
            value={draft.code}
            onChange={(event) => updateDraft("code", event.target.value)}
            aria-invalid={fieldErrors.code !== undefined}
            placeholder="round"
            autoComplete="off"
          />
          {fieldErrors.code ? (
            <FieldError errors={[{ message: fieldErrors.code }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.name !== undefined}>
          <FieldLabel htmlFor="new-shape-name">Shape Name</FieldLabel>
          <Input
            id="new-shape-name"
            name="name"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            aria-invalid={fieldErrors.name !== undefined}
            placeholder="Round"
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
          disabled={!isShapeDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
