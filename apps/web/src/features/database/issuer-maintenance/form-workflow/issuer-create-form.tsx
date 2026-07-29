import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "@coin-archive/db"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"

import { submitCreateIssuer } from "../actions"
import type { IssuerMutationResult } from "../actions"
import type { IssuerFieldErrors } from "../validation"
import {
  EMPTY_ISSUER_DRAFT,
  getCreateIssuerSubmission,
  getParentIssuerOptions,
  isIssuerDraftComplete,
} from "./issuer-form.shared"
import type { IssuerDraft } from "./issuer-form.shared"

type IssuerCreateFormProps = {
  issuers: IssuerMaintenanceRecord[]
  onCreated?: () => void
}

const createIssuerAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: {
      code: string
      isoCode: string
      name: string
      parentIssuerId: string | null
    }) => data
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateIssuer(session?.user ?? null, data)
  })

export function IssuerCreateForm({
  issuers,
  onCreated,
}: IssuerCreateFormProps) {
  const router = useRouter()
  const createIssuer = useServerFn(createIssuerAction)
  const [draft, setDraft] = useState<IssuerDraft>(EMPTY_ISSUER_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<IssuerFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const parentIssuerOptions = useMemo(
    () => getParentIssuerOptions(issuers),
    [issuers]
  )

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: IssuerMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  function updateDraft<TFieldName extends keyof IssuerDraft>(
    field: TFieldName,
    value: IssuerDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const submission = getCreateIssuerSubmission(draft, issuers)

    if (submission.status === "invalid") {
      applyResult(submission.result)
      return
    }

    setIsPending(true)

    try {
      const result = await createIssuer({
        data: submission.data,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_ISSUER_DRAFT)
        await router.invalidate()
        onCreated?.()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      id="database-issuer-create-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="new-issuer-code">Issuer Code</FieldLabel>
          <Input
            id="new-issuer-code"
            name="code"
            value={draft.code}
            onChange={(event) => updateDraft("code", event.target.value)}
            aria-invalid={fieldErrors.code !== undefined}
            placeholder="argentine-republic"
            autoComplete="off"
          />
          {fieldErrors.code ? (
            <FieldError errors={[{ message: fieldErrors.code }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.name !== undefined}>
          <FieldLabel htmlFor="new-issuer-name">Issuer Name</FieldLabel>
          <Input
            id="new-issuer-name"
            name="name"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            aria-invalid={fieldErrors.name !== undefined}
            placeholder="Argentine Republic"
            autoComplete="off"
          />
          {fieldErrors.name ? (
            <FieldError errors={[{ message: fieldErrors.name }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.isoCode !== undefined}>
          <FieldLabel htmlFor="new-issuer-iso-code">Issuer ISO Code</FieldLabel>
          <Input
            id="new-issuer-iso-code"
            name="isoCode"
            value={draft.isoCode}
            onChange={(event) => updateDraft("isoCode", event.target.value)}
            aria-invalid={fieldErrors.isoCode !== undefined}
            placeholder="AR"
            autoComplete="off"
          />
          {fieldErrors.isoCode ? (
            <FieldError errors={[{ message: fieldErrors.isoCode }]} />
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.parentIssuerId !== undefined}>
          <FieldLabel htmlFor="new-parent-issuer">Parent Issuer</FieldLabel>
          <Input
            id="new-parent-issuer"
            name="parentIssuer"
            list="issuer-parent-options-create"
            value={draft.parentIssuerLabel}
            onChange={(event) =>
              updateDraft("parentIssuerLabel", event.target.value)
            }
            aria-invalid={fieldErrors.parentIssuerId !== undefined}
            placeholder="Search Parent Issuer..."
            autoComplete="off"
          />
          <datalist id="issuer-parent-options-create">
            {parentIssuerOptions.map((option) => (
              <option key={option.id} value={option.label} />
            ))}
          </datalist>
          {fieldErrors.parentIssuerId ? (
            <FieldError errors={[{ message: fieldErrors.parentIssuerId }]} />
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
          disabled={!isIssuerDraftComplete(draft)}
          className="w-full"
        >
          Create
        </SubmitButton>
      </div>
    </form>
  )
}
