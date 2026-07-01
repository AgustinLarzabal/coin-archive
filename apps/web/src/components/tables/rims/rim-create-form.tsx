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
  RimFieldErrors,
  RimMutationResult,
} from "@/lib/rim-maintenance"
import {
  createRimInputSchema,
  getRimFieldErrors,
  submitCreateRim,
} from "@/lib/rim-maintenance"

import { EMPTY_RIM_DRAFT, isRimDraftComplete } from "./rim-form.shared"
import type { RimDraft } from "./rim-form.shared"

type RimCreateFormProps = {
  onCreated?: () => void
}

const createRimAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: RimDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateRim(session?.user ?? null, data)
  })

function validateRimDraft(draft: RimDraft): RimMutationResult | null {
  const parsedInput = createRimInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getRimFieldErrors(parsedInput.error.issues),
  }
}

export function RimCreateForm({ onCreated }: RimCreateFormProps) {
  const router = useRouter()
  const createRim = useServerFn(createRimAction)
  const [draft, setDraft] = useState<RimDraft>(EMPTY_RIM_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<RimFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: RimMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
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

    const validationResult = validateRimDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createRim({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_RIM_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-rim-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="new-rim-code">Rim Code</FieldLabel>
          <Input
            id="new-rim-code"
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
          <FieldLabel htmlFor="new-rim-name">Rim Name</FieldLabel>
          <Input
            id="new-rim-name"
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

      <div className="mt-auto flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!isRimDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
