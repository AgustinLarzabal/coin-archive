import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { DistributionOption } from "@coin-archive/db"
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
  DistributionFieldErrors,
  DistributionMutationResult,
} from "../actions"
import {
  getDistributionFieldErrors,
  submitUpdateDistribution,
  updateDistributionInputSchema,
} from "../actions"

import {
  createDistributionDraft,
  normalizeDistributionDraft,
} from "./distribution-form.shared"
import type { DistributionDraft } from "./distribution-form.shared"

type DistributionEditFormProps = {
  distribution: DistributionOption
  onSaved?: () => void
}

const updateDistributionAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: DistributionDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateDistribution(session?.user ?? null, data)
  })

function validateUpdateDistributionDraft(
  distributionId: string,
  draft: DistributionDraft
): DistributionMutationResult | null {
  const parsedInput = updateDistributionInputSchema.safeParse({
    id: distributionId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getDistributionFieldErrors(parsedInput.error.issues),
  }
}

export function hasDistributionEditChanges(
  distribution: DistributionOption,
  draft: DistributionDraft
) {
  const normalizedCurrent = normalizeDistributionDraft(
    createDistributionDraft(distribution)
  )
  const normalizedDraft = normalizeDistributionDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function DistributionEditForm({
  distribution,
  onSaved,
}: DistributionEditFormProps) {
  const router = useRouter()
  const updateDistribution = useServerFn(updateDistributionAction)
  const [draft, setDraft] = useState<DistributionDraft>(
    createDistributionDraft(distribution)
  )
  const [fieldErrors, setFieldErrors] = useState<DistributionFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasChanges = hasDistributionEditChanges(distribution, draft)

  useEffect(() => {
    setDraft(createDistributionDraft(distribution))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [distribution])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: DistributionMutationResult) {
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

  function updateDraft<TFieldName extends keyof DistributionDraft>(
    field: TFieldName,
    value: DistributionDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateUpdateDistributionDraft(
      distribution.id,
      draft
    )

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await updateDistribution({
        data: {
          id: distribution.id,
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
      id="database-distribution-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="distribution-code">Distribution Code</FieldLabel>
          <Input
            id="distribution-code"
            name="code"
            value={draft.code}
            onChange={(event) => updateDraft("code", event.target.value)}
            aria-invalid={fieldErrors.code !== undefined}
            placeholder="standard-circulation"
            autoComplete="off"
          />
          {fieldErrors.code ? (
            <FieldError errors={[{ message: fieldErrors.code }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.name !== undefined}>
          <FieldLabel htmlFor="distribution-name">Distribution Name</FieldLabel>
          <Input
            id="distribution-name"
            name="name"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            aria-invalid={fieldErrors.name !== undefined}
            placeholder="Standard circulation"
            autoComplete="off"
          />
          {fieldErrors.name ? (
            <FieldError errors={[{ message: fieldErrors.name }]} />
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
