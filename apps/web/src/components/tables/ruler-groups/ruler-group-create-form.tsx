import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  RulerGroupFieldErrors,
  RulerGroupMutationResult,
} from "@/lib/ruler-group-maintenance"
import {
  createRulerGroupInputSchema,
  getRulerGroupFieldErrors,
  submitCreateRulerGroup,
} from "@/lib/ruler-group-maintenance"

import { RulerGroupFormFields } from "./ruler-group-form-fields"
import {
  EMPTY_RULER_GROUP_DRAFT,
  isRulerGroupDraftComplete,
} from "./ruler-group-form.shared"
import type { RulerGroupDraft } from "./ruler-group-form.shared"

type RulerGroupCreateFormProps = {
  onCreated?: () => void
}

const createRulerGroupAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: RulerGroupDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateRulerGroup(session?.user ?? null, data)
  })

function validateRulerGroupDraft(
  draft: RulerGroupDraft
): RulerGroupMutationResult | null {
  const parsedInput = createRulerGroupInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getRulerGroupFieldErrors(parsedInput.error.issues),
  }
}

export function RulerGroupCreateForm({
  onCreated,
}: RulerGroupCreateFormProps) {
  const router = useRouter()
  const createRulerGroup = useServerFn(createRulerGroupAction)
  const [draft, setDraft] = useState<RulerGroupDraft>(EMPTY_RULER_GROUP_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<RulerGroupFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: RulerGroupMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  function updateDraft<TFieldName extends keyof RulerGroupDraft>(
    field: TFieldName,
    value: RulerGroupDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateRulerGroupDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createRulerGroup({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_RULER_GROUP_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-ruler-group-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <RulerGroupFormFields
        codeInputId="new-ruler-group-code"
        nameInputId="new-ruler-group-name"
        codePlaceholder="house-of-bourbon"
        namePlaceholder="House of Bourbon"
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
          disabled={!isRulerGroupDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
