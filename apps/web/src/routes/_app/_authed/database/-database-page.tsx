import { useEffect, useId, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CatalogueOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Plus, RotateCcw, Save } from "lucide-react"

import { getAuthSession } from "@/lib/auth-session"
import type {
  CatalogueFieldErrors,
  CatalogueMutationResult,
} from "@/lib/catalogue-maintenance"
import {
  createCatalogueInputSchema,
  getCatalogueFieldErrors,
  submitCreateCatalogue,
  submitUpdateCatalogue,
  updateCatalogueInputSchema,
} from "@/lib/catalogue-maintenance"

export const databaseSecondaryMenuItems = [
  { to: "/database", label: "General" },
  { to: "/database/catalogues", label: "Catalogs" },
] as const

type CatalogueMaintenancePageProps = {
  catalogues: CatalogueOption[]
}

type CatalogueMaintenanceTableProps = {
  catalogues: CatalogueOption[]
}

type CatalogueDraft = {
  code: string
  title: string
}

const EMPTY_CATALOGUE_DRAFT: CatalogueDraft = {
  code: "",
  title: "",
}

export const getCatalogueMaintenanceCatalogues = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getCatalogues } = await import("@workspace/db")

  return getCatalogues()
})

const createCatalogueMaintenanceCatalogue = createServerFn({
  method: "POST",
})
  .inputValidator((data: CatalogueDraft) => data)
  .handler(async ({ data }) => {
    const collector = await getCatalogueMutationCollector()

    return submitCreateCatalogue(collector, data)
  })

const updateCatalogueMaintenanceCatalogue = createServerFn({
  method: "POST",
})
  .inputValidator((data: CatalogueDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const collector = await getCatalogueMutationCollector()

    return submitUpdateCatalogue(collector, data)
  })

export function CatalogueMaintenancePage({
  catalogues,
}: CatalogueMaintenancePageProps) {
  return (
    <div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Catalogues</h2>
        <p className="text-sm text-muted-foreground">
          Add a Catalogue or edit an existing Catalogue Code and Catalogue
          Title.
        </p>
      </div>
      <CatalogueCreateForm />
      <CatalogueMaintenanceTable catalogues={catalogues} />
    </div>
  )
}

export function CatalogueMaintenanceAccessDeniedPage() {
  return (
    <div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Access denied</h2>
        <p className="text-sm text-muted-foreground">
          Only Editors and Admins can access catalogue maintenance.
        </p>
      </div>
    </div>
  )
}

async function getCatalogueMutationCollector() {
  const session = await getAuthSession()

  return session?.user ?? null
}

function validateCatalogueDraft(
  draft: CatalogueDraft,
  catalogueId?: string
): CatalogueMutationResult | null {
  const parsedInput =
    catalogueId === undefined
      ? createCatalogueInputSchema.safeParse(draft)
      : updateCatalogueInputSchema.safeParse({
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

function useCatalogueFormFeedback() {
  const [fieldErrors, setFieldErrors] = useState<CatalogueFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function clear() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function apply(result: CatalogueMutationResult) {
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

  return {
    fieldErrors,
    formError,
    successMessage,
    setFieldErrors,
    setFormError,
    clear,
    apply,
  }
}

function CatalogueCreateForm() {
  const router = useRouter()
  const createCatalogue = useServerFn(createCatalogueMaintenanceCatalogue)
  const [draft, setDraft] = useState<CatalogueDraft>(EMPTY_CATALOGUE_DRAFT)
  const { apply, clear, fieldErrors, formError, successMessage } =
    useCatalogueFormFeedback()
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clear()

    const validationResult = validateCatalogueDraft(draft)

    if (validationResult !== null) {
      apply(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = await createCatalogue({
        data: draft,
      })
      const shouldReset = apply(result)

      if (shouldReset) {
        setDraft(EMPTY_CATALOGUE_DRAFT)
        await router.invalidate()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="catalogue-code">
            Catalogue Code
          </label>
          <Input
            id="catalogue-code"
            name="code"
            placeholder="KM"
            value={draft.code}
            onChange={(event) =>
              setDraft((current) => ({ ...current, code: event.target.value }))
            }
            aria-invalid={fieldErrors.code !== undefined}
          />
          {fieldErrors.code ? (
            <p className="text-sm text-destructive">{fieldErrors.code}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="catalogue-title">
            Catalogue Title
          </label>
          <Input
            id="catalogue-title"
            name="title"
            placeholder="Standard Catalog of World Coins"
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
            aria-invalid={fieldErrors.title !== undefined}
          />
          {fieldErrors.title ? (
            <p className="text-sm text-destructive">{fieldErrors.title}</p>
          ) : null}
        </div>
      </div>
      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}
      {successMessage ? (
        <p className="text-sm text-emerald-700">{successMessage}</p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        <Plus className="size-4" />
        Add Catalogue
      </Button>
    </form>
  )
}

function CatalogueEditForm({ catalogue }: { catalogue: CatalogueOption }) {
  const router = useRouter()
  const updateCatalogue = useServerFn(updateCatalogueMaintenanceCatalogue)
  const [draft, setDraft] = useState<CatalogueDraft>({
    code: catalogue.code,
    title: catalogue.title,
  })
  const {
    apply,
    clear,
    fieldErrors,
    formError,
    successMessage,
    setFieldErrors,
    setFormError,
  } = useCatalogueFormFeedback()
  const [isPending, setIsPending] = useState(false)
  const formId = useId()

  useEffect(() => {
    setDraft({
      code: catalogue.code,
      title: catalogue.title,
    })
    setFieldErrors({})
    setFormError(null)
  }, [catalogue.code, catalogue.title, setFieldErrors, setFormError])

  const hasChanges =
    draft.code !== catalogue.code || draft.title !== catalogue.title

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    clear()

    const validationResult = validateCatalogueDraft(draft, catalogue.id)

    if (validationResult !== null) {
      apply(validationResult)
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
      const shouldRefresh = apply(result)

      if (shouldRefresh) {
        await router.invalidate()
      }
    } finally {
      setIsPending(false)
    }
  }

  function handleReset() {
    clear()
    setDraft({
      code: catalogue.code,
      title: catalogue.title,
    })
  }

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} />
      <tr className="border-t align-top">
        <td className="p-4">
          <div className="space-y-2">
            <Input
              form={formId}
              name="code"
              placeholder="KM"
              value={draft.code}
              onChange={(event) =>
                setDraft((current) => ({ ...current, code: event.target.value }))
              }
              aria-invalid={fieldErrors.code !== undefined}
            />
            {fieldErrors.code ? (
              <p className="text-sm text-destructive">{fieldErrors.code}</p>
            ) : null}
          </div>
        </td>
        <td className="p-4">
          <div className="space-y-2">
            <Input
              form={formId}
              name="title"
              placeholder="Standard Catalog of World Coins"
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              aria-invalid={fieldErrors.title !== undefined}
            />
            {fieldErrors.title ? (
              <p className="text-sm text-destructive">{fieldErrors.title}</p>
            ) : null}
          </div>
        </td>
        <td className="space-y-2 p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              form={formId}
              size="sm"
              disabled={isPending || !hasChanges}
            >
              <Save className="size-4" />
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || !hasChanges}
              onClick={handleReset}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-emerald-700">{successMessage}</p>
          ) : null}
        </td>
      </tr>
    </>
  )
}

function CatalogueMaintenanceTable({
  catalogues,
}: CatalogueMaintenanceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 rounded-xl border">
        <thead className="bg-muted/50 text-left text-sm">
          <tr>
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {catalogues.map((catalogue) => (
            <CatalogueEditForm key={catalogue.id} catalogue={catalogue} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
