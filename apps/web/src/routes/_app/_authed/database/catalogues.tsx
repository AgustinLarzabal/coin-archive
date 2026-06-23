import { createFileRoute } from "@tanstack/react-router"

import { SecondaryMenu } from "@/components/secondary-menu"
import { getEditorRouteAuthorization } from "@/lib/private-route"
import {
  CatalogueMaintenanceAccessDeniedPage,
  CatalogueMaintenancePage,
  databaseSecondaryMenuItems,
  getCatalogueMaintenanceCatalogues,
} from "./-database-page"

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
    <div className="max-w-3xl">
      <SecondaryMenu items={[...databaseSecondaryMenuItems]} />

      <main className="mt-8">
        <CatalogueMaintenancePage catalogues={loaderData.catalogues} />
      </main>
    </div>
  )
}
