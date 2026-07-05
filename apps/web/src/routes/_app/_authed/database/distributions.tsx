import { createFileRoute } from "@tanstack/react-router"
import {
  DistributionMaintenanceRouteComponent,
  loadDistributionMaintenanceRouteData,
} from "@/features/database/distribution-maintenance"

export const Route = createFileRoute("/_app/_authed/database/distributions")({
  loader: loadDistributionMaintenanceRouteData,
  component: DatabaseDistributionsComponent,
})

function DatabaseDistributionsComponent() {
  return <DistributionMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
}
