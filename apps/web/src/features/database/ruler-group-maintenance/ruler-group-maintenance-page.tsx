import { renderMaintenancePage } from "../maintenance-page"
import type { RulerGroupMaintenancePageLoaderData } from "./ruler-group-maintenance-route-data"
import { RulerGroupsTable } from "./table-workflow/ruler-groups-table"

type RulerGroupMaintenanceRouteComponentProps = {
  loaderData: RulerGroupMaintenancePageLoaderData
}

export function RulerGroupMaintenanceRouteComponent({
  loaderData,
}: RulerGroupMaintenanceRouteComponentProps) {
  return renderRulerGroupMaintenancePage(loaderData)
}

export function renderRulerGroupMaintenancePage(
  loaderData: RulerGroupMaintenancePageLoaderData
) {
  return renderMaintenancePage(loaderData, ({ rulerGroups }) => (
    <main className="mt-8">
      <RulerGroupsTable rulerGroups={rulerGroups} />
    </main>
  ))
}
