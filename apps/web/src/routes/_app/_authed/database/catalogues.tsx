import { createFileRoute } from "@tanstack/react-router"
import {
  CatalogueMaintenanceRouteComponent,
  loadCatalogueMaintenanceRouteData,
} from "@/features/database/catalogue-maintenance"

export const Route = createFileRoute("/_app/_authed/database/catalogues")({
  loader: loadCatalogueMaintenanceRouteData,
  component: DatabaseCataloguesComponent,
})

function DatabaseCataloguesComponent() {
  return (
    <CatalogueMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
  )
}
