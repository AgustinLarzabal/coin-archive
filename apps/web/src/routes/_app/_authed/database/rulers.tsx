import { createFileRoute } from "@tanstack/react-router"
import {
  loadRulerMaintenanceRouteData,
  RulerMaintenanceRouteComponent,
} from "@/features/database/ruler-maintenance"

export const Route = createFileRoute("/_app/_authed/database/rulers")({
  loader: loadRulerMaintenanceRouteData,
  component: DatabaseRulersComponent,
})

function DatabaseRulersComponent() {
  return (
    <RulerMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
  )
}
