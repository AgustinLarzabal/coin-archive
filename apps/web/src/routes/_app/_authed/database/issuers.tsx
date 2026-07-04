import { createFileRoute } from "@tanstack/react-router"
import {
  IssuerMaintenanceRouteComponent,
  loadIssuerMaintenanceRouteData,
} from "@/features/database/issuer-maintenance"

export const Route = createFileRoute("/_app/_authed/database/issuers")({
  loader: loadIssuerMaintenanceRouteData,
  component: DatabaseIssuersRouteComponent,
})

function DatabaseIssuersRouteComponent() {
  const loaderData = Route.useLoaderData()

  return <IssuerMaintenanceRouteComponent loaderData={loaderData} />
}
