import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { MintOption } from "@workspace/db"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  MintFieldErrors,
  MintMutationResult,
} from "../actions"
import {
  getMintFieldErrors,
  submitUpdateMint,
  updateMintInputSchema,
} from "../actions"

import { createMintDraft, normalizeMintDraft } from "./mint-form.shared"
import { MintFormFields } from "./mint-form-fields"
import type { MintDraft } from "./mint-form.shared"

type MintEditFormProps = {
  mint: MintOption
  onSaved?: () => void
}

const updateMintAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: MintDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateMint(session?.user ?? null, data)
  })

function validateMintDraft(
  mintId: string,
  draft: MintDraft
): MintMutationResult | null {
  const parsedInput = updateMintInputSchema.safeParse({
    id: mintId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getMintFieldErrors(parsedInput.error.issues),
  }
}

export function hasMintEditChanges(mint: MintOption, draft: MintDraft) {
  const normalizedCurrent = normalizeMintDraft(createMintDraft(mint))
  const normalizedDraft = normalizeMintDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function MintEditForm({ mint, onSaved }: MintEditFormProps) {
  const router = useRouter()
  const updateMint = useServerFn(updateMintAction)
  const [draft, setDraft] = useState<MintDraft>(createMintDraft(mint))
  const [fieldErrors, setFieldErrors] = useState<MintFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasChanges = hasMintEditChanges(mint, draft)

  useEffect(() => {
    setDraft(createMintDraft(mint))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [mint])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: MintMutationResult) {
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

    const validationResult = validateMintDraft(mint.id, draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateMint({
        data: {
          id: mint.id,
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
      id="database-mint-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <MintFormFields
        draft={draft}
        fieldErrors={fieldErrors}
        onFieldChange={updateDraft}
        variant="edit"
      />

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
