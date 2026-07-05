import { createFileRoute } from "@tanstack/react-router"
import {
  ShapeMaintenanceRouteComponent,
  loadShapeMaintenanceRouteData,
} from "@/features/database/shape-maintenance"

export const Route = createFileRoute("/_app/_authed/database/shapes")({
  loader: loadShapeMaintenanceRouteData,
  component: DatabaseShapesComponent,
})

function DatabaseShapesComponent() {
  return <ShapeMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
}
