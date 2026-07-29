import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  MintingTechniqueFieldErrors,
  MintingTechniqueMutationResult,
} from "../actions"
import {
  createMintingTechniqueInputSchema,
  getMintingTechniqueFieldErrors,
  submitCreateMintingTechnique,
} from "../actions"

import {
  EMPTY_MINTING_TECHNIQUE_DRAFT,
  isMintingTechniqueDraftComplete,
} from "./minting-technique-form.shared"
import type { MintingTechniqueDraft } from "./minting-technique-form.shared"
import { MintingTechniqueFormFields } from "./minting-technique-form-fields"

type MintingTechniqueCreateFormProps = {
  onCreated?: () => void
}

const createMintingTechniqueAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: MintingTechniqueDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateMintingTechnique(session?.user ?? null, data)
  })

function validateMintingTechniqueDraft(
  draft: MintingTechniqueDraft
): MintingTechniqueMutationResult | null {
  const parsedInput = createMintingTechniqueInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getMintingTechniqueFieldErrors(parsedInput.error.issues),
  }
}

export function MintingTechniqueCreateForm({
  onCreated,
}: MintingTechniqueCreateFormProps) {
  const router = useRouter()
  const createMintingTechnique = useServerFn(createMintingTechniqueAction)
  const [draft, setDraft] = useState<MintingTechniqueDraft>(
    EMPTY_MINTING_TECHNIQUE_DRAFT
  )
  const [fieldErrors, setFieldErrors] = useState<MintingTechniqueFieldErrors>(
    {}
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: MintingTechniqueMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  function updateDraft<TFieldName extends keyof MintingTechniqueDraft>(
    field: TFieldName,
    value: MintingTechniqueDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateMintingTechniqueDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createMintingTechnique({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_MINTING_TECHNIQUE_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-minting-technique-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <MintingTechniqueFormFields
        draft={draft}
        fieldErrors={fieldErrors}
        onDraftChange={updateDraft}
        variant="create"
      />

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}

      <div className="mt-auto flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!isMintingTechniqueDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
