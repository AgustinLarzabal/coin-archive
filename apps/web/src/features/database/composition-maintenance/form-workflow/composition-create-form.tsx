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
import { Textarea } from "@workspace/ui/components/textarea"

import { getAuthSession } from "@/lib/auth-session"
import { submitCreateComposition } from "../actions"
import type { CompositionMutationResult } from "../actions"
import {
  createCompositionInputSchema,
  getCompositionFieldErrors,
} from "../validation"
import type { CompositionFieldErrors } from "../validation"

type CompositionDraft = {
  code: string
  name: string
  description: string
}

type CompositionCreateFormProps = {
  onCreated?: () => void
}

const EMPTY_DRAFT: CompositionDraft = {
  code: "",
  name: "",
  description: "",
}

const createCompositionAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: CompositionDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateComposition(session?.user ?? null, data)
  })

function validateCompositionDraft(
  draft: CompositionDraft
): CompositionMutationResult | null {
  const parsedInput = createCompositionInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getCompositionFieldErrors(parsedInput.error.issues),
  }
}

export function isCompositionCreateReady(draft: CompositionDraft) {
  return draft.code.trim().length > 0 && draft.name.trim().length > 0
}

export function CompositionCreateForm({
  onCreated,
}: CompositionCreateFormProps) {
  const router = useRouter()
  const createComposition = useServerFn(createCompositionAction)
  const [draft, setDraft] = useState<CompositionDraft>(EMPTY_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<CompositionFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: CompositionMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
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

    const validationResult = validateCompositionDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createComposition({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-composition-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="new-composition-code">
            Composition Code
          </FieldLabel>
          <Input
            id="new-composition-code"
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
          <FieldLabel htmlFor="new-composition-name">
            Composition Name
          </FieldLabel>
          <Input
            id="new-composition-name"
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
          <FieldLabel htmlFor="new-composition-description">
            Composition Description
          </FieldLabel>
          <Textarea
            id="new-composition-description"
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

      <div className="mt-auto flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!isCompositionCreateReady(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
