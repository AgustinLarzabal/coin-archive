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
  OrientationFieldErrors,
  OrientationMutationResult,
} from "@/lib/orientation-maintenance"
import {
  createOrientationInputSchema,
  getOrientationFieldErrors,
  submitCreateOrientation,
} from "@/lib/orientation-maintenance"

import { EMPTY_ORIENTATION_DRAFT, isOrientationDraftComplete } from "./orientation-form.shared"
import type { OrientationDraft } from "./orientation-form.shared"

type OrientationCreateFormProps = {
  onCreated?: () => void
}

const createOrientationAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: OrientationDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateOrientation(session?.user ?? null, data)
  })

function validateOrientationDraft(draft: OrientationDraft): OrientationMutationResult | null {
  const parsedInput = createOrientationInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getOrientationFieldErrors(parsedInput.error.issues),
  }
}

export function OrientationCreateForm({ onCreated }: OrientationCreateFormProps) {
  const router = useRouter()
  const createOrientation = useServerFn(createOrientationAction)
  const [draft, setDraft] = useState<OrientationDraft>(EMPTY_ORIENTATION_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<OrientationFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: OrientationMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  function updateDraft<FieldName extends keyof OrientationDraft>(
    field: FieldName,
    value: OrientationDraft[FieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateOrientationDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createOrientation({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_ORIENTATION_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-orientation-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="new-orientation-code">Orientation Code</FieldLabel>
          <Input
            id="new-orientation-code"
            name="code"
            value={draft.code}
            onChange={(event) => updateDraft("code", event.target.value)}
            aria-invalid={fieldErrors.code !== undefined}
            placeholder="coin-alignment"
            autoComplete="off"
          />
          {fieldErrors.code ? (
            <FieldError errors={[{ message: fieldErrors.code }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.name !== undefined}>
          <FieldLabel htmlFor="new-orientation-name">Orientation Name</FieldLabel>
          <Input
            id="new-orientation-name"
            name="name"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            aria-invalid={fieldErrors.name !== undefined}
            placeholder="Coin alignment"
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
          disabled={!isOrientationDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
