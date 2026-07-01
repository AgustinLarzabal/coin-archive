import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RimOption } from "@workspace/db"
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
  RimFieldErrors,
  RimMutationResult,
} from "@/lib/rim-maintenance"
import {
  getRimFieldErrors,
  submitUpdateRim,
  updateRimInputSchema,
} from "@/lib/rim-maintenance"

import { createRimDraft, normalizeRimDraft } from "./rim-form.shared"
import type { RimDraft } from "./rim-form.shared"

type RimEditFormProps = {
  rim: RimOption
  onSaved?: () => void
}

const updateRimAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: RimDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateRim(session?.user ?? null, data)
  })

function validateUpdateRimDraft(
  rimId: string,
  draft: RimDraft
): RimMutationResult | null {
  const parsedInput = updateRimInputSchema.safeParse({
    id: rimId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getRimFieldErrors(parsedInput.error.issues),
  }
}

export function hasRimEditChanges(rim: RimOption, draft: RimDraft) {
  const normalizedCurrent = normalizeRimDraft(createRimDraft(rim))
  const normalizedDraft = normalizeRimDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function RimEditForm({ rim, onSaved }: RimEditFormProps) {
  const router = useRouter()
  const updateRim = useServerFn(updateRimAction)
  const [draft, setDraft] = useState<RimDraft>(createRimDraft(rim))
  const [fieldErrors, setFieldErrors] = useState<RimFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasChanges = hasRimEditChanges(rim, draft)

  useEffect(() => {
    setDraft(createRimDraft(rim))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [rim])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: RimMutationResult) {
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

  function updateDraft<FieldName extends keyof RimDraft>(
    field: FieldName,
    value: RimDraft[FieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateUpdateRimDraft(rim.id, draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateRim({
        data: {
          id: rim.id,
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
      id="database-rim-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="rim-code">Rim Code</FieldLabel>
          <Input
            id="rim-code"
            name="code"
            value={draft.code}
            onChange={(event) => updateDraft("code", event.target.value)}
            aria-invalid={fieldErrors.code !== undefined}
            placeholder="raised"
            autoComplete="off"
          />
          {fieldErrors.code ? (
            <FieldError errors={[{ message: fieldErrors.code }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.name !== undefined}>
          <FieldLabel htmlFor="rim-name">Rim Name</FieldLabel>
          <Input
            id="rim-name"
            name="name"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            aria-invalid={fieldErrors.name !== undefined}
            placeholder="Raised rim"
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
