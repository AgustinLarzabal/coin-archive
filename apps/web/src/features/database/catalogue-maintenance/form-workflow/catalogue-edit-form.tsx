import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CatalogueOption } from "@coin-archive/db"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  CatalogueFieldErrors,
  CatalogueMutationResult,
} from "../actions"
import {
  getCatalogueFieldErrors,
  submitUpdateCatalogue,
  updateCatalogueInputSchema,
} from "../actions"

type CatalogueDraft = {
  code: string
  title: string
}

const updateCatalogueMaintenanceCatalogue = createServerFn({
  method: "POST",
})
  .inputValidator((data: CatalogueDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateCatalogue(session?.user ?? null, data)
  })

function validateCatalogueDraft(
  catalogueId: string,
  draft: CatalogueDraft
): CatalogueMutationResult | null {
  const parsedInput = updateCatalogueInputSchema.safeParse({
    id: catalogueId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getCatalogueFieldErrors(parsedInput.error.issues),
  }
}

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
  const [draft, setDraft] = useState<CatalogueDraft>({
    code: catalogue.code,
    title: catalogue.title,
  })
  const [fieldErrors, setFieldErrors] = useState<CatalogueFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setDraft({
      code: catalogue.code,
      title: catalogue.title,
    })
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [catalogue])

  const hasChanges =
    draft.code !== catalogue.code || draft.title !== catalogue.title

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

    const validationResult = validateCatalogueDraft(catalogue.id, draft)

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
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="catalogue-code">Code</FieldLabel>
          <Input
            id="catalogue-code"
            name="code"
            value={draft.code}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                code: event.target.value,
              }))
            }
            aria-invalid={fieldErrors.code !== undefined}
            placeholder="KM"
            autoComplete="off"
          />
          {fieldErrors.code ? (
            <FieldError errors={[{ message: fieldErrors.code }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.title !== undefined}>
          <FieldLabel htmlFor="catalogue-title">Title</FieldLabel>
          <Input
            id="catalogue-title"
            name="title"
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            aria-invalid={fieldErrors.title !== undefined}
            placeholder="Standard Catalog of World Coins"
            autoComplete="off"
          />
          {fieldErrors.title ? (
            <FieldError errors={[{ message: fieldErrors.title }]} />
          ) : null}
        </Field>
      </FieldGroup>

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
