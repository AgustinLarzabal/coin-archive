import { createFileRoute } from "@tanstack/react-router"
import {
  CompositionMaintenanceRouteComponent,
  loadCompositionMaintenanceRouteData,
} from "@/features/database/composition-maintenance"

export const Route = createFileRoute("/_app/_authed/database/compositions")({
  loader: () => loadCompositionMaintenanceRouteData(),
  component: DatabaseCompositionsComponent,
})

function DatabaseCompositionsComponent() {
  return (
    <CompositionMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
  )
}
