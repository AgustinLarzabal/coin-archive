import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitCreateCatalogue } from "../actions"
import type { CatalogueMutationResult } from "../catalogue-mutation-errors"
import type { CatalogueFieldErrors } from "../catalogue-validation"

import { CatalogueFormFields } from "./catalogue-form-fields"
import {
  EMPTY_CATALOGUE_DRAFT,
  hasCatalogueCreateInput,
  validateCatalogueCreateDraft,
} from "./catalogue-form.shared"
import type { CatalogueDraft } from "./catalogue-form.shared"

type CatalogueCreateFormProps = {
  onCreated?: () => void
}

const createCatalogueMaintenanceCatalogue = createServerFn({
  method: "POST",
})
  .inputValidator((data: CatalogueDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateCatalogue(session?.user ?? null, data)
  })

export function CatalogueCreateForm({
  onCreated,
}: CatalogueCreateFormProps) {
  const router = useRouter()
  const createCatalogue = useServerFn(createCatalogueMaintenanceCatalogue)
  const [draft, setDraft] = useState<CatalogueDraft>(EMPTY_CATALOGUE_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<CatalogueFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const canSubmit = hasCatalogueCreateInput(draft)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: CatalogueMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateCatalogueCreateDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createCatalogue({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_CATALOGUE_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-catalogue-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <CatalogueFormFields
        draft={draft}
        fieldErrors={fieldErrors}
        onFieldChange={(field, value) =>
          setDraft((current) => ({ ...current, [field]: value }))
        }
        variant="create"
      />

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}

      <div className="mt-auto flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!canSubmit}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
