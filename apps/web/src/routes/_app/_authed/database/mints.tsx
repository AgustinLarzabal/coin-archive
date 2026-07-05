import { createFileRoute } from "@tanstack/react-router"
import {
  loadMintMaintenanceRouteData,
  MintMaintenanceRouteComponent,
} from "@/features/database/mint-maintenance"

export const Route = createFileRoute("/_app/_authed/database/mints")({
  loader: loadMintMaintenanceRouteData,
  component: DatabaseMintsComponent,
})

function DatabaseMintsComponent() {
  return (
    <MintMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
  )
}
