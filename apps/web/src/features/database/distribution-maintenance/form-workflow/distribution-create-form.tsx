import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  DistributionFieldErrors,
  DistributionMutationResult,
} from "../actions"
import {
  createDistributionInputSchema,
  getDistributionFieldErrors,
  submitCreateDistribution,
} from "../actions"

import {
  EMPTY_DISTRIBUTION_DRAFT,
  isDistributionDraftComplete,
} from "./distribution-form.shared"
import type { DistributionDraft } from "./distribution-form.shared"

type DistributionCreateFormProps = {
  onCreated?: () => void
}

const createDistributionAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: DistributionDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateDistribution(session?.user ?? null, data)
  })

function validateDistributionDraft(
  draft: DistributionDraft
): DistributionMutationResult | null {
  const parsedInput = createDistributionInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getDistributionFieldErrors(parsedInput.error.issues),
  }
}

export function DistributionCreateForm({
  onCreated,
}: DistributionCreateFormProps) {
  const router = useRouter()
  const createDistribution = useServerFn(createDistributionAction)
  const [draft, setDraft] = useState<DistributionDraft>(EMPTY_DISTRIBUTION_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<DistributionFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: DistributionMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
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

    const validationResult = validateDistributionDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createDistribution({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_DISTRIBUTION_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-distribution-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="new-distribution-code">
            Distribution Code
          </FieldLabel>
          <Input
            id="new-distribution-code"
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
          <FieldLabel htmlFor="new-distribution-name">
            Distribution Name
          </FieldLabel>
          <Input
            id="new-distribution-name"
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

      <div className="mt-auto flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!isDistributionDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
