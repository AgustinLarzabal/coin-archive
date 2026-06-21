import { createFileRoute, redirect } from "@tanstack/react-router"

import { PrivatePage } from "../components/private-page"
import { getAuthSession } from "../lib/auth-session"
import { getEditorRouteAccess } from "../lib/private-route"

const DATABASE_ROUTE_PATH = "/database"

export const Route = createFileRoute("/database")({
  loader: async () => {
    const session = await getAuthSession()
    const access = getEditorRouteAccess(session?.user ?? null, DATABASE_ROUTE_PATH)

    if ("to" in access) {
      throw redirect(access)
    }

    return access
  },
  component: DatabasePage,
})

function DatabasePage() {
  const { isAllowed } = Route.useLoaderData()

  return isAllowed ? (
    <CatalogueMaintenancePage />
  ) : (
    <CatalogueMaintenanceAccessDeniedPage />
  )
}

export function CatalogueMaintenancePage() {
  return (
    <PrivatePage
      title="Catalogue Maintenance"
      description="Maintain catalogue data here as Editor and Admin tools are added."
    >
      <section className="space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Catalogues</h2>
        <p className="text-sm text-muted-foreground">
          Catalogue maintenance for Catalogues will appear here later.
        </p>
      </section>
    </PrivatePage>
  )
}

export function CatalogueMaintenanceAccessDeniedPage() {
  return (
    <PrivatePage
      title="Catalogue Maintenance"
      description="Maintain catalogue data here as Editor and Admin tools are added."
    >
      <section className="space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Access denied</h2>
        <p className="text-sm text-muted-foreground">
          Only Editors and Admins can access catalogue maintenance.
        </p>
      </section>
    </PrivatePage>
  )
}
