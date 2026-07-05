import { createFileRoute } from "@tanstack/react-router"
import {
  loadRulerGroupMaintenanceRouteData,
  RulerGroupMaintenanceRouteComponent,
} from "@/features/database/ruler-group-maintenance"

export const Route = createFileRoute("/_app/_authed/database/ruler-groups")({
  loader: loadRulerGroupMaintenanceRouteData,
  component: DatabaseRulerGroupsComponent,
})

function DatabaseRulerGroupsComponent() {
  return (
    <RulerGroupMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
  )
}
