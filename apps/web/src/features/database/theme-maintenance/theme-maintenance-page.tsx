import { renderMaintenancePage } from "../maintenance-page"
import type { ThemeMaintenancePageLoaderData } from "./theme-maintenance-route-data"
import { ThemesTable } from "./table-workflow/themes-table"

type ThemeMaintenanceRouteComponentProps = {
  loaderData: ThemeMaintenancePageLoaderData
}

export function ThemeMaintenanceRouteComponent({
  loaderData,
}: ThemeMaintenanceRouteComponentProps) {
  return renderMaintenancePage(loaderData, ({ themes }) => (
    <main className="mt-8">
      <ThemesTable themes={themes} />
    </main>
  ))
}
