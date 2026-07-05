import { createFileRoute } from "@tanstack/react-router"
import {
  RimMaintenanceRouteComponent,
  loadRimMaintenanceRouteData,
} from "@/features/database/rim-maintenance"

export const Route = createFileRoute("/_app/_authed/database/rims")({
  loader: loadRimMaintenanceRouteData,
  component: DatabaseRimsComponent,
})

function DatabaseRimsComponent() {
  return <RimMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
}
