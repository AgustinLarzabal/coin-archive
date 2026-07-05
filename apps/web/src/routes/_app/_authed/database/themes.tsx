import { createFileRoute } from "@tanstack/react-router"
import {
  ThemeMaintenanceRouteComponent,
  loadThemeMaintenanceRouteData,
} from "@/features/database/theme-maintenance"

export const Route = createFileRoute("/_app/_authed/database/themes")({
  loader: loadThemeMaintenanceRouteData,
  component: DatabaseThemesComponent,
})

function DatabaseThemesComponent() {
  return <ThemeMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
}
