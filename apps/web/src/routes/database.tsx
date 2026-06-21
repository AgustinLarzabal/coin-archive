import type { ReactNode } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getCatalogues } from "@workspace/db"
import type { CatalogueOption } from "@workspace/db"

import { PrivatePage } from "../components/private-page"
import { getAuthSession } from "../lib/auth-session"
import { getEditorRouteAccess } from "../lib/private-route"

const DATABASE_ROUTE_PATH = "/database"
const DATABASE_PAGE_TITLE = "Catalogue Maintenance"
const DATABASE_PAGE_DESCRIPTION = "Maintain existing Catalogues."
const DATABASE_SECTION_CLASS_NAME =
  "space-y-3 rounded-2xl border bg-card p-6 shadow-sm"

const getCatalogueMaintenanceData = createServerFn({ method: "GET" }).handler(
  async () => ({
    catalogues: await getCatalogues(),
  })
)

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

    return {
      ...access,
      ...(access.isAllowed ? await getCatalogueMaintenanceData() : {}),
    }
  },
  component: DatabasePage,
})

function DatabasePage() {
  const { catalogues = [], isAllowed } = Route.useLoaderData()

  return isAllowed ? (
    <CatalogueMaintenancePage catalogues={catalogues} />
  ) : (
    <CatalogueMaintenanceAccessDeniedPage />
  )
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

export function CatalogueMaintenancePage({
  catalogues,
}: CatalogueMaintenancePageProps) {
  return (
    <CatalogueMaintenanceScaffold>
      <h2 className="text-lg font-semibold">Catalogues</h2>
      <CatalogueMaintenanceTable catalogues={catalogues} />
    </CatalogueMaintenanceScaffold>
  )
}

type CatalogueMaintenancePageProps = {
  catalogues: CatalogueOption[]
}

function CatalogueMaintenanceTable({
  catalogues,
}: CatalogueMaintenancePageProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 pr-4 font-medium" scope="col">
              Code
            </th>
            <th className="py-2 font-medium" scope="col">
              Title
            </th>
          </tr>
        </thead>
        <tbody>
          {catalogues.map((catalogue) => (
            <tr className="border-b last:border-b-0" key={catalogue.id}>
              <td className="py-3 pr-4 align-top font-medium">
                {catalogue.code}
              </td>
              <td className="py-3 align-top">{catalogue.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
