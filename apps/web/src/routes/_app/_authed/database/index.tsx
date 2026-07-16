import { createFileRoute } from "@tanstack/react-router"
import {
  DatabaseOverviewRouteComponent,
  loadDatabaseOverviewRouteData,
} from "@/features/database/overview"

export const Route = createFileRoute("/_app/_authed/database/")({
  loader: loadDatabaseOverviewRouteData,
  component: DatabaseIndexRouteComponent,
})

function DatabaseIndexRouteComponent() {
  return <DatabaseOverviewRouteComponent loaderData={Route.useLoaderData()} />
}
