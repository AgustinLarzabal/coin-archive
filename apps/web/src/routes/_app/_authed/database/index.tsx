import { createFileRoute } from "@tanstack/react-router"
import {
  DatabaseOverviewRouteComponent,
  loadDatabaseOverviewRouteData,
} from "@/features/database/database-overview"

export const Route = createFileRoute("/_app/_authed/database/")({
  loader: loadDatabaseOverviewRouteData,
  component: DatabaseIndexRouteComponent,
})

function DatabaseIndexRouteComponent() {
  const loaderData = Route.useLoaderData()

  return <DatabaseOverviewRouteComponent loaderData={loaderData} />
}
