import { createFileRoute } from "@tanstack/react-router"
import {
  OrientationMaintenanceRouteComponent,
  loadOrientationMaintenanceRouteData,
} from "@/features/database/orientation-maintenance"

export const Route = createFileRoute("/_app/_authed/database/orientations")({
  loader: loadOrientationMaintenanceRouteData,
  component: DatabaseOrientationsComponent,
})

function DatabaseOrientationsComponent() {
  return <OrientationMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
}
