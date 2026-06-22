import { useEffect, useId, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CatalogueOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Plus, RotateCcw, Save } from "lucide-react"

import { PrivatePage } from "../../components/private-page"
import { getRequestAuthSession } from "../../lib/auth-session"
import { getEditorRouteAuthorization } from "../../lib/private-route"
import type {
  CatalogueFieldErrors,
  CatalogueMutationResult,
} from "./-database-form"
import {
  createCatalogueInputSchema,
  getCatalogueFieldErrors,
  submitCreateCatalogue,
  submitUpdateCatalogue,
  updateCatalogueInputSchema,
} from "./-database-form"

const DATABASE_PAGE_TITLE = "Catalogue Maintenance"
const DATABASE_PAGE_DESCRIPTION = "Create and maintain Catalogues."
const DATABASE_SECTION_CLASS_NAME =
  "space-y-4 rounded-2xl border bg-card p-6 shadow-sm"

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

const getCatalogueMaintenanceCatalogues = createServerFn({
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

export const Route = createFileRoute("/_authed/database")({
  loader: async ({ context }) => {
    const authorization = getEditorRouteAuthorization(context.session.user)

    if (!authorization.isAllowed) {
      return authorization
    }

    const catalogues = await getCatalogueMaintenanceCatalogues()

    return {
      ...authorization,
      catalogues,
    }
  },
  component: DatabasePage,
})

function DatabasePage() {
  const loaderData = Route.useLoaderData()

  if (!loaderData.isAllowed) {
    return <CatalogueMaintenanceAccessDeniedPage />
  }

  return <CatalogueMaintenancePage catalogues={loaderData.catalogues} />
}

async function getCatalogueMutationCollector() {
  const session = await getRequestAuthSession()

  return session?.user ?? null
}

type CatalogueMaintenanceScaffoldProps = {
  children: ReactNode
}

function CatalogueMaintenanceScaffold({
  children,
}: CatalogueMaintenanceScaffoldProps) {
  return (
    <PrivatePage
      title={DATABASE_PAGE_TITLE}
      description={DATABASE_PAGE_DESCRIPTION}
    >
      <section className={DATABASE_SECTION_CLASS_NAME}>{children}</section>
    </PrivatePage>
  )
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

export function CatalogueMaintenancePage({
  catalogues,
}: CatalogueMaintenancePageProps) {
  return (
    <CatalogueMaintenanceScaffold>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Catalogues</h2>
        <p className="text-sm text-muted-foreground">
          Add a Catalogue or edit an existing Catalogue Code and Catalogue
          Title.
        </p>
      </div>
      <CatalogueCreateForm />
      <CatalogueMaintenanceTable catalogues={catalogues} />
    </CatalogueMaintenanceScaffold>
  )
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
            value={draft.code}
            placeholder="KM"
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                code: event.target.value,
              }))
            }
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
            value={draft.title}
            placeholder="Standard Catalog of World Coins"
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                title: event.target.value,
              }))
            }
          />
          {fieldErrors.title ? (
            <p className="text-sm text-destructive">{fieldErrors.title}</p>
          ) : null}
        </div>
      </div>
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      {successMessage ? (
        <p className="text-sm text-emerald-700">{successMessage}</p>
      ) : null}
      <Button className="gap-2" type="submit" disabled={isPending}>
        <Plus className="size-4" />
        Add Catalogue
      </Button>
    </form>
  )
}

type CatalogueEditFormProps = {
  catalogue: CatalogueOption
}

function CatalogueEditForm({ catalogue }: CatalogueEditFormProps) {
  const formId = useId()
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
    setFieldErrors,
    setFormError,
    successMessage,
  } = useCatalogueFormFeedback()
  const [isPending, setIsPending] = useState(false)
  const hasChanges =
    draft.code !== catalogue.code || draft.title !== catalogue.title

  useEffect(() => {
    setDraft({
      code: catalogue.code,
      title: catalogue.title,
    })
    setFieldErrors({})
    setFormError(null)
  }, [catalogue.code, catalogue.title, setFieldErrors, setFormError])

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
              value={draft.code}
              placeholder="KM"
              disabled={isPending}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  code: event.target.value,
                }))
              }
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
              value={draft.title}
              placeholder="Standard Catalog of World Coins"
              disabled={isPending}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  title: event.target.value,
                }))
              }
            />
            {fieldErrors.title ? (
              <p className="text-sm text-destructive">{fieldErrors.title}</p>
            ) : null}
          </div>
        </td>
        <td className="space-y-2 p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              className="gap-2"
              form={formId}
              type="submit"
              size="sm"
              disabled={!hasChanges || isPending}
            >
              <Save className="size-4" />
              Save
            </Button>
            <Button
              className="gap-2"
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasChanges || isPending}
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

export function CatalogueMaintenanceAccessDeniedPage() {
  return (
    <CatalogueMaintenanceScaffold>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Access denied</h2>
        <p className="text-sm text-muted-foreground">
          Only Editors and Admins can access catalogue maintenance.
        </p>
      </div>
    </CatalogueMaintenanceScaffold>
  )
}
