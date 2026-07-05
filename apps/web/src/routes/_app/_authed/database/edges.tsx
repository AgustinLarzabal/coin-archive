import { createFileRoute } from "@tanstack/react-router"
import {
  EdgeMaintenanceRouteComponent,
  loadEdgeMaintenanceRouteData,
} from "@/features/database/edge-maintenance"

export const Route = createFileRoute("/_app/_authed/database/edges")({
  loader: loadEdgeMaintenanceRouteData,
  component: DatabaseEdgesComponent,
})

function DatabaseEdgesComponent() {
  return <EdgeMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
}
