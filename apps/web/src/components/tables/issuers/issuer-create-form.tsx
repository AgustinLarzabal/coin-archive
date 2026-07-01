import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  IssuerFieldErrors,
  IssuerMutationResult,
} from "@/lib/issuer-maintenance"
import {
  createIssuerInputSchema,
  getIssuerFieldErrors,
  submitCreateIssuer,
} from "@/lib/issuer-maintenance"

import {
  EMPTY_ISSUER_DRAFT,
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
  .inputValidator((data: IssuerDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateIssuer(session?.user ?? null, data)
  })

function validateIssuerDraft(draft: IssuerDraft): IssuerMutationResult | null {
  const parsedInput = createIssuerInputSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getIssuerFieldErrors(parsedInput.error.issues),
  }
}

export function formatParentIssuerOptionLabel(
  issuer: IssuerMaintenanceRecord
): string {
  const issuerLabel = `${issuer.name} (${issuer.code})`

  if (issuer.parent === null) {
    return issuerLabel
  }

  return `${issuerLabel} - Parent: ${issuer.parent.name} (${issuer.parent.code})`
}

export function filterParentIssuerOptions(
  issuers: IssuerMaintenanceRecord[],
  filterValue: string
) {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return issuers
  }

  return issuers.filter((issuer) =>
    formatParentIssuerOptionLabel(issuer)
      .toLocaleLowerCase()
      .includes(normalizedFilterValue)
  )
}

export function IssuerCreateForm({
  issuers,
  onCreated,
}: IssuerCreateFormProps) {
  const router = useRouter()
  const createIssuer = useServerFn(createIssuerAction)
  const [draft, setDraft] = useState<IssuerDraft>(EMPTY_ISSUER_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<IssuerFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isParentSelectorOpen, setIsParentSelectorOpen] = useState(false)
  const [parentFilterValue, setParentFilterValue] = useState("")
  const [isPending, setIsPending] = useState(false)

  const parentIssuerOptions = useMemo(
    () => filterParentIssuerOptions(issuers, parentFilterValue),
    [issuers, parentFilterValue]
  )

  const selectedParentIssuer = useMemo(
    () => issuers.find((issuer) => issuer.id === draft.parentIssuerId) ?? null,
    [draft.parentIssuerId, issuers]
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

  function updateDraft<FieldName extends keyof IssuerDraft>(
    field: FieldName,
    value: IssuerDraft[FieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function selectParentIssuer(parentIssuerId: string) {
    updateDraft("parentIssuerId", parentIssuerId)
    setParentFilterValue("")
    setIsParentSelectorOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clearFeedback()

    const validationResult = validateIssuerDraft(draft)

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createIssuer({
        data: draft,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        setDraft(EMPTY_ISSUER_DRAFT)
        setParentFilterValue("")
        setIsParentSelectorOpen(false)
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
          <FieldLabel htmlFor="new-issuer-parent-search">Parent Issuer</FieldLabel>
          <p className="text-sm text-muted-foreground">
            Search parent issuers by name, code, or parent context...
          </p>
          <Popover open={isParentSelectorOpen} onOpenChange={setIsParentSelectorOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between text-left font-normal"
                  aria-invalid={fieldErrors.parentIssuerId !== undefined}
                />
              }
            >
              {selectedParentIssuer
                ? formatParentIssuerOptionLabel(selectedParentIssuer)
                : "No Parent Issuer"}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-(--anchor-width)">
              <Input
                id="new-issuer-parent-search"
                value={parentFilterValue}
                onChange={(event) => setParentFilterValue(event.target.value)}
                placeholder="Search parent issuers by name, code, or parent context..."
                autoComplete="off"
              />
              <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start whitespace-normal text-left"
                  onClick={() => selectParentIssuer("")}
                >
                  No Parent Issuer
                </Button>
                {parentIssuerOptions.map((issuer) => (
                  <Button
                    key={issuer.id}
                    type="button"
                    variant="ghost"
                    className="justify-start whitespace-normal text-left"
                    onClick={() => selectParentIssuer(issuer.id)}
                  >
                    {formatParentIssuerOptionLabel(issuer)}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {fieldErrors.parentIssuerId ? (
            <FieldError errors={[{ message: fieldErrors.parentIssuerId }]} />
          ) : null}
        </Field>
      </FieldGroup>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

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
