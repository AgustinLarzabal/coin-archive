import { useEffect, useId, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CatalogueOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Plus, RotateCcw, Save } from "lucide-react"

import { PrivatePage } from "../components/private-page"
import { getAuthSession } from "../lib/auth-session"
import { getEditorRouteAccess } from "../lib/private-route"
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

const DATABASE_ROUTE_PATH = "/database"
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

export const Route = createFileRoute("/database")({
  loader: async () => {
    const session = await getAuthSession()
    const access = getEditorRouteAccess(
      session?.user ?? null,
      DATABASE_ROUTE_PATH
    )

    if ("to" in access) {
      throw redirect(access)
    }

    if (!access.isAllowed) {
      return access
    }

    const catalogues = await getCatalogueMaintenanceCatalogues()

    return {
      ...access,
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
  const [{ auth }, { getRequestHeaders }] = await Promise.all([
    import("@workspace/auth/server"),
    import("@tanstack/react-start/server"),
  ])

  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })

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
  if (catalogueId === undefined) {
    const parsedInput = createCatalogueInputSchema.safeParse(draft)

    if (parsedInput.success) {
      return null
    }

    return {
      status: "error",
      fieldErrors: getCatalogueFieldErrors(parsedInput.error.issues),
    }
  }

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
  const {
    apply,
    clear,
    fieldErrors,
    formError,
    successMessage,
  } = useCatalogueFormFeedback()
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
      const isSuccess = apply(result)

      if (!isSuccess) {
        return
      }

      setDraft(EMPTY_CATALOGUE_DRAFT)
      await router.invalidate()
    } finally {
      setIsPending(false)
    }
  }

  function handleDraftChange(
    field: keyof CatalogueDraft,
    value: CatalogueDraft[keyof CatalogueDraft]
  ) {
    clear()
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }))
  }

  return (
    <form className="space-y-3 rounded-xl border p-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-[12rem_minmax(0,1fr)_auto] md:items-start">
        <div className="space-y-1">
          <label
            className="text-xs font-medium"
            htmlFor="catalogue-create-code"
          >
            Catalogue Code
          </label>
          <Input
            id="catalogue-create-code"
            name="code"
            placeholder="KM"
            value={draft.code}
            aria-invalid={fieldErrors.code !== undefined}
            onChange={(event) => handleDraftChange("code", event.target.value)}
          />
          <CatalogueFieldError message={fieldErrors.code} />
        </div>
        <div className="space-y-1">
          <label
            className="text-xs font-medium"
            htmlFor="catalogue-create-title"
          >
            Catalogue Title
          </label>
          <Input
            id="catalogue-create-title"
            name="title"
            placeholder="Standard Catalog of World Coins"
            value={draft.title}
            aria-invalid={fieldErrors.title !== undefined}
            onChange={(event) => handleDraftChange("title", event.target.value)}
          />
          <CatalogueFieldError message={fieldErrors.title} />
        </div>
        <div className="flex items-end">
          <Button disabled={isPending} type="submit">
            <Plus />
            Add Catalogue
          </Button>
        </div>
      </div>
      <CatalogueFormFeedback
        formError={formError}
        successMessage={successMessage}
      />
    </form>
  )
}

function CatalogueMaintenanceTable({
  catalogues,
}: CatalogueMaintenanceTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 pr-4 pl-4 font-medium" scope="col">
              Code
            </th>
            <th className="py-2 pr-4 font-medium" scope="col">
              Title
            </th>
            <th className="py-2 pr-4 font-medium" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {catalogues.map((catalogue) => (
            <CatalogueMaintenanceRow catalogue={catalogue} key={catalogue.id} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CatalogueMaintenanceRow({
  catalogue,
}: {
  catalogue: CatalogueOption
}) {
  const router = useRouter()
  const updateCatalogue = useServerFn(updateCatalogueMaintenanceCatalogue)
  const formId = useId()
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

  useEffect(() => {
    setDraft({
      code: catalogue.code,
      title: catalogue.title,
    })
    setFieldErrors({})
    setFormError(null)
  }, [catalogue.code, catalogue.title, setFieldErrors, setFormError])

  const isDirty =
    draft.code !== catalogue.code || draft.title !== catalogue.title

  function handleDraftChange(
    field: keyof CatalogueDraft,
    value: CatalogueDraft[keyof CatalogueDraft]
  ) {
    clear()
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }))
  }

  function handleReset() {
    setDraft({
      code: catalogue.code,
      title: catalogue.title,
    })
    clear()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
      const isSuccess = apply(result)

      if (!isSuccess) {
        return
      }

      await router.invalidate()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <tr className="border-b last:border-b-0">
      <td className="p-4 align-top">
        <Input
          form={formId}
          name="code"
          value={draft.code}
          aria-invalid={fieldErrors.code !== undefined}
          onChange={(event) => handleDraftChange("code", event.target.value)}
        />
        <CatalogueFieldError message={fieldErrors.code} />
      </td>
      <td className="p-4 align-top">
        <Input
          form={formId}
          name="title"
          value={draft.title}
          aria-invalid={fieldErrors.title !== undefined}
          onChange={(event) => handleDraftChange("title", event.target.value)}
        />
        <CatalogueFieldError message={fieldErrors.title} />
      </td>
      <td className="p-4 align-top">
        <form id={formId} onSubmit={handleSubmit} />
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={!isDirty || isPending} form={formId} type="submit">
            <Save />
            Save
          </Button>
          {isDirty ? (
            <Button onClick={handleReset} type="button" variant="outline">
              <RotateCcw />
              Reset
            </Button>
          ) : null}
        </div>
        <CatalogueFormFeedback
          formError={formError}
          successMessage={successMessage}
        />
      </td>
    </tr>
  )
}

function CatalogueFieldError({ message }: { message?: string }) {
  if (message === undefined) {
    return null
  }

  return (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {message}
    </p>
  )
}

function CatalogueFormFeedback({
  formError,
  successMessage,
}: {
  formError: string | null
  successMessage: string | null
}) {
  return (
    <div className="mt-2 space-y-1">
      {formError !== null ? (
        <p className="text-xs text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      {successMessage !== null ? (
        <p className="text-xs text-foreground" role="status">
          {successMessage}
        </p>
      ) : null}
    </div>
  )
}

export function CatalogueMaintenanceAccessDeniedPage() {
  return (
    <CatalogueMaintenanceScaffold>
      <h2 className="text-lg font-semibold">Access denied</h2>
      <p className="text-sm text-muted-foreground">
        Only Editors and Admins can access catalogue maintenance.
      </p>
    </CatalogueMaintenanceScaffold>
  )
}
