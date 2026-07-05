import { createFileRoute } from "@tanstack/react-router"
import {
  MintingTechniqueMaintenanceRouteComponent,
  loadMintingTechniqueMaintenanceRouteData,
} from "@/features/database/minting-technique-maintenance"

export const Route = createFileRoute("/_app/_authed/database/minting-techniques")({
  loader: loadMintingTechniqueMaintenanceRouteData,
  component: DatabaseMintingTechniquesComponent,
})

function DatabaseMintingTechniquesComponent() {
  return <MintingTechniqueMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
}
