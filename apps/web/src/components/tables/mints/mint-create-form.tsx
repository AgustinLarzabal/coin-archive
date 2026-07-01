import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  MintFieldErrors,
  MintMutationResult,
} from "@/lib/mint-maintenance"
import {
  createMintInputSchema,
  getMintFieldErrors,
  submitCreateMint,
} from "@/lib/mint-maintenance"

import { EMPTY_MINT_DRAFT, isMintDraftComplete } from "./mint-form.shared"
import { MintFormFields } from "./mint-form-fields"
import type { MintDraft } from "./mint-form.shared"

type MintCreateFormProps = {
  onCreated?: () => void
}

const createMintAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: MintDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateMint(session?.user ?? null, data)
  })

function validateMintDraft(draft: MintDraft): MintMutationResult | null {
  const parsedInput = createMintInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getMintFieldErrors(parsedInput.error.issues),
  }
}

export function MintCreateForm({ onCreated }: MintCreateFormProps) {
  const router = useRouter()
  const createMint = useServerFn(createMintAction)
  const [draft, setDraft] = useState<MintDraft>(EMPTY_MINT_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<MintFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: MintMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  function updateDraft<TFieldName extends keyof MintDraft>(
    field: TFieldName,
    value: MintDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateMintDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createMint({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_MINT_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-mint-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <MintFormFields
        draft={draft}
        fieldErrors={fieldErrors}
        onFieldChange={updateDraft}
        variant="create"
      />

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <div className="mt-auto flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!isMintDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
