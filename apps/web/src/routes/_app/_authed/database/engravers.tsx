import { createFileRoute } from "@tanstack/react-router"
import {
  EngraverMaintenanceRouteComponent,
  loadEngraverMaintenanceRouteData,
} from "@/features/database/engraver-maintenance"

export const Route = createFileRoute("/_app/_authed/database/engravers")({
  loader: loadEngraverMaintenanceRouteData,
  component: DatabaseEngraversComponent,
})

function DatabaseEngraversComponent() {
  return (
    <EngraverMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
  )
}
