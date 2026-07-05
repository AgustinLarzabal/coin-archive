import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { TechniqueOption } from "@workspace/db"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  MintingTechniqueFieldErrors,
  MintingTechniqueMutationResult,
} from "../actions"
import {
  getMintingTechniqueFieldErrors,
  submitUpdateMintingTechnique,
  updateMintingTechniqueInputSchema,
} from "../actions"

import {
  createMintingTechniqueDraft,
  normalizeMintingTechniqueDraft,
} from "./minting-technique-form.shared"
import type { MintingTechniqueDraft } from "./minting-technique-form.shared"
import { MintingTechniqueFormFields } from "./minting-technique-form-fields"

type MintingTechniqueEditFormProps = {
  mintingTechnique: TechniqueOption
  onSaved?: () => void
}

const updateMintingTechniqueAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: MintingTechniqueDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateMintingTechnique(session?.user ?? null, data)
  })

function validateUpdateMintingTechniqueDraft(
  mintingTechniqueId: string,
  draft: MintingTechniqueDraft
): MintingTechniqueMutationResult | null {
  const parsedInput = updateMintingTechniqueInputSchema.safeParse({
    id: mintingTechniqueId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getMintingTechniqueFieldErrors(parsedInput.error.issues),
  }
}

export function hasMintingTechniqueEditChanges(
  mintingTechnique: TechniqueOption,
  draft: MintingTechniqueDraft
) {
  const normalizedCurrent = normalizeMintingTechniqueDraft(
    createMintingTechniqueDraft(mintingTechnique)
  )
  const normalizedDraft = normalizeMintingTechniqueDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function MintingTechniqueEditForm({
  mintingTechnique,
  onSaved,
}: MintingTechniqueEditFormProps) {
  const router = useRouter()
  const updateMintingTechnique = useServerFn(updateMintingTechniqueAction)
  const [draft, setDraft] = useState<MintingTechniqueDraft>(
    createMintingTechniqueDraft(mintingTechnique)
  )
  const [fieldErrors, setFieldErrors] = useState<MintingTechniqueFieldErrors>(
    {}
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasChanges = hasMintingTechniqueEditChanges(mintingTechnique, draft)

  useEffect(() => {
    setDraft(createMintingTechniqueDraft(mintingTechnique))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [mintingTechnique])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: MintingTechniqueMutationResult) {
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

    const validationResult = validateUpdateMintingTechniqueDraft(
      mintingTechnique.id,
      draft
    )

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateMintingTechnique({
        data: {
          id: mintingTechnique.id,
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
      id="database-minting-technique-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <MintingTechniqueFormFields
        draft={draft}
        fieldErrors={fieldErrors}
        onDraftChange={updateDraft}
        variant="edit"
      />

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
          disabled={!hasChanges}
          className="w-full"
        >
          Save
        </SubmitButton>
      </div>
    </form>
  )
}
