import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  RimFieldErrors,
  RimMutationResult,
} from "../actions"
import {
  createRimInputSchema,
  getRimFieldErrors,
  submitCreateRim,
} from "../actions"

import { RimFormFields } from "./rim-form-fields"
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

  function updateDraft<TFieldName extends keyof RimDraft>(
    field: TFieldName,
    value: RimDraft[TFieldName]
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
      <RimFormFields
        codeInputId="new-rim-code"
        nameInputId="new-rim-name"
        codePlaceholder="raised"
        namePlaceholder="Raised rim"
        draft={draft}
        fieldErrors={fieldErrors}
        onDraftChange={updateDraft}
      />

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
