import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
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
  createCatalogueInputSchema,
  getCatalogueFieldErrors,
  submitCreateCatalogue,
} from "../actions"

type CatalogueDraft = {
  code: string
  title: string
}

type CatalogueCreateFormProps = {
  onCreated?: () => void
}

const EMPTY_DRAFT: CatalogueDraft = {
  code: "",
  title: "",
}

const createCatalogueMaintenanceCatalogue = createServerFn({
  method: "POST",
})
  .inputValidator((data: CatalogueDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateCatalogue(session?.user ?? null, data)
  })

function validateCatalogueDraft(
  draft: CatalogueDraft
): CatalogueMutationResult | null {
  const parsedInput = createCatalogueInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getCatalogueFieldErrors(parsedInput.error.issues),
  }
}

export function CatalogueCreateForm({
  onCreated,
}: CatalogueCreateFormProps) {
  const router = useRouter()
  const createCatalogue = useServerFn(createCatalogueMaintenanceCatalogue)
  const [draft, setDraft] = useState<CatalogueDraft>(EMPTY_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<CatalogueFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const canSubmit =
    draft.code.trim().length > 0 || draft.title.trim().length > 0

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

    const validationResult = validateCatalogueDraft(draft)

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
        setDraft(EMPTY_DRAFT)
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
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="new-catalogue-code">Code</FieldLabel>
          <Input
            id="new-catalogue-code"
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
          <FieldLabel htmlFor="new-catalogue-title">Title</FieldLabel>
          <Input
            id="new-catalogue-title"
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
