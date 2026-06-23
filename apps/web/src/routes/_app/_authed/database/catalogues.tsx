import { createFileRoute } from "@tanstack/react-router"

import { getEditorRouteAuthorization } from "@/lib/private-route"
import {
  CatalogueMaintenanceAccessDeniedPage,
  getCatalogueMaintenanceCatalogues,
} from "./-database-page"
import { CataloguesTable } from "@/components/catalogues-table"

export const Route = createFileRoute("/_app/_authed/database/catalogues")({
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
  component: DatabaseCataloguesComponent,
})

function DatabaseCataloguesComponent() {
  const loaderData = Route.useLoaderData()

  if (!loaderData.isAllowed) {
    return <CatalogueMaintenanceAccessDeniedPage />
  }

  return (
    <main className="mt-8">
      <CataloguesTable catalogues={loaderData.catalogues} />
    </main>
  )
}
