import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CatalogueOption } from "@coin-archive/db"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitUpdateCatalogue } from "../actions"
import type { CatalogueMutationResult } from "../catalogue-mutation-errors"
import type { CatalogueFieldErrors } from "../catalogue-validation"

import { CatalogueFormFields } from "./catalogue-form-fields"
import {
  createCatalogueDraft,
  hasCatalogueEditChanges,
  validateCatalogueUpdateDraft,
} from "./catalogue-form.shared"
import type { CatalogueDraft } from "./catalogue-form.shared"

const updateCatalogueMaintenanceCatalogue = createServerFn({
  method: "POST",
})
  .inputValidator((data: CatalogueDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateCatalogue(session?.user ?? null, data)
  })

type CatalogueEditFormProps = {
  catalogue: CatalogueOption
  onSaved?: () => void
}

export function CatalogueEditForm({
  catalogue,
  onSaved,
}: CatalogueEditFormProps) {
  const router = useRouter()
  const updateCatalogue = useServerFn(updateCatalogueMaintenanceCatalogue)
  const [draft, setDraft] = useState<CatalogueDraft>(() =>
    createCatalogueDraft(catalogue)
  )
  const [fieldErrors, setFieldErrors] = useState<CatalogueFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setDraft(createCatalogueDraft(catalogue))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [catalogue])

  const hasChanges = hasCatalogueEditChanges(catalogue, draft)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: CatalogueMutationResult) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateCatalogueUpdateDraft(catalogue.id, draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateCatalogue({
        data: {
          id: catalogue.id,
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
      id="database-catalogue-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <CatalogueFormFields
        draft={draft}
        fieldErrors={fieldErrors}
        onFieldChange={(field, value) =>
          setDraft((current) => ({ ...current, [field]: value }))
        }
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
