import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CompositionOption } from "@workspace/db"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { SubmitButton } from "@workspace/ui/components/submit-button"
import { Textarea } from "@workspace/ui/components/textarea"

import { getAuthSession } from "@/lib/auth-session"
import { submitUpdateComposition } from "../actions"
import type { CompositionMutationResult } from "../actions"
import {
  getCompositionFieldErrors,
  updateCompositionInputSchema,
} from "../validation"
import type { CompositionFieldErrors } from "../validation"

type CompositionDraft = {
  code: string
  name: string
  description: string
}

type CompositionEditFormProps = {
  composition: CompositionOption
  onSaved?: () => void
}

const updateCompositionAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: CompositionDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateComposition(session?.user ?? null, data)
  })

function validateCompositionDraft(
  compositionId: string,
  draft: CompositionDraft
): CompositionMutationResult | null {
  const parsedInput = updateCompositionInputSchema.safeParse({
    id: compositionId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getCompositionFieldErrors(parsedInput.error.issues),
  }
}

function createCompositionDraft(
  composition: CompositionOption
): CompositionDraft {
  return {
    code: composition.code,
    name: composition.name,
    description: composition.description ?? "",
  }
}

function normalizeDraftForComparison(
  draft: CompositionDraft
): CompositionDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
    description: draft.description.trim(),
  }
}

export function hasCompositionEditChanges(
  composition: CompositionOption,
  draft: CompositionDraft
) {
  const normalizedCurrent = normalizeDraftForComparison(
    createCompositionDraft(composition)
  )
  const normalizedDraft = normalizeDraftForComparison(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name ||
    normalizedDraft.description !== normalizedCurrent.description
  )
}

export function CompositionEditForm({
  composition,
  onSaved,
}: CompositionEditFormProps) {
  const router = useRouter()
  const updateComposition = useServerFn(updateCompositionAction)
  const [draft, setDraft] = useState<CompositionDraft>(
    createCompositionDraft(composition)
  )
  const [fieldErrors, setFieldErrors] = useState<CompositionFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setDraft(createCompositionDraft(composition))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [composition])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: CompositionMutationResult) {
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

  function updateDraft<TFieldName extends keyof CompositionDraft>(
    field: TFieldName,
    value: CompositionDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateCompositionDraft(composition.id, draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateComposition({
        data: {
          id: composition.id,
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
      id="database-composition-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="composition-code">Composition Code</FieldLabel>
          <Input
            id="composition-code"
            name="code"
            value={draft.code}
            onChange={(event) => updateDraft("code", event.target.value)}
            aria-invalid={fieldErrors.code !== undefined}
            placeholder="silver-900"
            autoComplete="off"
          />
          {fieldErrors.code ? (
            <FieldError errors={[{ message: fieldErrors.code }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.name !== undefined}>
          <FieldLabel htmlFor="composition-name">Composition Name</FieldLabel>
          <Input
            id="composition-name"
            name="name"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            aria-invalid={fieldErrors.name !== undefined}
            placeholder="Silver (.900)"
            autoComplete="off"
          />
          {fieldErrors.name ? (
            <FieldError errors={[{ message: fieldErrors.name }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.description !== undefined}>
          <FieldLabel htmlFor="composition-description">
            Composition Description
          </FieldLabel>
          <Textarea
            id="composition-description"
            name="description"
            value={draft.description}
            onChange={(event) => updateDraft("description", event.target.value)}
            aria-invalid={fieldErrors.description !== undefined}
            placeholder="Optional alloy, layer, or part details."
          />
          {fieldErrors.description ? (
            <FieldError errors={[{ message: fieldErrors.description }]} />
          ) : null}
        </Field>
      </FieldGroup>

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
          disabled={!hasCompositionEditChanges(composition, draft)}
          className="w-full"
        >
          Save
        </SubmitButton>
      </div>
    </form>
  )
}
