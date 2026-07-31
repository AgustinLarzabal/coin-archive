import { renderMaintenancePage } from "../maintenance-page"
import type { LoaderData } from "./theme-maintenance-route-data"
import { ThemesTable } from "./table-workflow/themes-table"

type ThemeMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function ThemeMaintenanceRouteComponent({
  loaderData,
}: ThemeMaintenanceRouteComponentProps) {
  return renderThemeMaintenancePage(loaderData)
}

export function renderThemeMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ themes }) => (
    <main className="mt-8">
      <ThemesTable themes={themes} />
    </main>
  ))
}
