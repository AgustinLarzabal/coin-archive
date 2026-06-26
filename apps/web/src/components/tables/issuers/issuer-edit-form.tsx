import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "@workspace/db"
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
  IssuerFieldErrors,
  IssuerMutationResult,
} from "@/lib/issuer-maintenance"
import {
  getIssuerFieldErrors,
  submitUpdateIssuer,
  updateIssuerInputSchema,
} from "@/lib/issuer-maintenance"

import {
  createIssuerDraft,
  getParentIssuerOptions,
  INVALID_PARENT_ISSUER_SELECTION,
  normalizeIssuerDraft,
  resolveParentIssuerId,
} from "./issuer-form.shared"
import type { IssuerDraft } from "./issuer-form.shared"

type IssuerEditFormProps = {
  issuer: IssuerMaintenanceRecord
  issuers: IssuerMaintenanceRecord[]
  onSaved?: () => void
}

const updateIssuerAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: {
      id: string
      code: string
      isoCode: string
      name: string
      parentIssuerId: string | null
    }) => data
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateIssuer(session?.user ?? null, data)
  })

function validateUpdateIssuerDraft(
  issuerId: string,
  draft: IssuerDraft,
  issuers: IssuerMaintenanceRecord[]
): IssuerMutationResult | null {
  const parentIssuerOptions = getParentIssuerOptions(issuers, issuerId)
  const parentIssuerId = resolveParentIssuerId(
    draft.parentIssuerLabel,
    parentIssuerOptions
  )

  if (parentIssuerId === INVALID_PARENT_ISSUER_SELECTION) {
    return {
      status: "error",
      fieldErrors: {
        parentIssuerId: "Select a Parent Issuer from the list.",
      },
    }
  }

  const parsedInput = updateIssuerInputSchema.safeParse({
    id: issuerId,
    code: draft.code,
    isoCode: draft.isoCode,
    name: draft.name,
    parentIssuerId,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getIssuerFieldErrors(parsedInput.error.issues),
  }
}

export function hasIssuerEditChanges(
  issuer: IssuerMaintenanceRecord,
  issuers: IssuerMaintenanceRecord[],
  draft: IssuerDraft
) {
  const normalizedCurrent = normalizeIssuerDraft(
    createIssuerDraft(issuer, issuers)
  )
  const normalizedDraft = normalizeIssuerDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.isoCode !== normalizedCurrent.isoCode ||
    normalizedDraft.name !== normalizedCurrent.name ||
    normalizedDraft.parentIssuerLabel !== normalizedCurrent.parentIssuerLabel
  )
}

export function IssuerEditForm({
  issuer,
  issuers,
  onSaved,
}: IssuerEditFormProps) {
  const router = useRouter()
  const updateIssuer = useServerFn(updateIssuerAction)
  const [draft, setDraft] = useState<IssuerDraft>(
    createIssuerDraft(issuer, issuers)
  )
  const [fieldErrors, setFieldErrors] = useState<IssuerFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const parentIssuerOptions = useMemo(
    () => getParentIssuerOptions(issuers, issuer.id),
    [issuer.id, issuers]
  )
  const hasChanges = hasIssuerEditChanges(issuer, issuers, draft)

  useEffect(() => {
    setDraft(createIssuerDraft(issuer, issuers))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [issuer, issuers])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: IssuerMutationResult) {
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

  function updateDraft<FieldName extends keyof IssuerDraft>(
    field: FieldName,
    value: IssuerDraft[FieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateUpdateIssuerDraft(
      issuer.id,
      draft,
      issuers
    )

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const resolvedParentIssuerId = resolveParentIssuerId(
        draft.parentIssuerLabel,
        parentIssuerOptions
      )
      const result = await updateIssuer({
        data: {
          id: issuer.id,
          code: draft.code,
          isoCode: draft.isoCode,
          name: draft.name,
          parentIssuerId:
            resolvedParentIssuerId === INVALID_PARENT_ISSUER_SELECTION
              ? null
              : resolvedParentIssuerId,
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
      id="database-issuer-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.code !== undefined}>
          <FieldLabel htmlFor="issuer-code">Issuer Code</FieldLabel>
          <Input
            id="issuer-code"
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
          <FieldLabel htmlFor="issuer-name">Issuer Name</FieldLabel>
          <Input
            id="issuer-name"
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
          <FieldLabel htmlFor="issuer-iso-code">Issuer ISO Code</FieldLabel>
          <Input
            id="issuer-iso-code"
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
          <FieldLabel htmlFor="parent-issuer">Parent Issuer</FieldLabel>
          <Input
            id="parent-issuer"
            name="parentIssuer"
            list="issuer-parent-options-edit"
            value={draft.parentIssuerLabel}
            onChange={(event) =>
              updateDraft("parentIssuerLabel", event.target.value)
            }
            aria-invalid={fieldErrors.parentIssuerId !== undefined}
            placeholder="Search Parent Issuer..."
            autoComplete="off"
          />
          <datalist id="issuer-parent-options-edit">
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
