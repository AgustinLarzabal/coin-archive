import { renderMaintenancePage } from "../maintenance-page"
import type { RulerMaintenancePageLoaderData } from "./ruler-maintenance-route-data"
import { RulersTable } from "./table-workflow/rulers-table"

type RulerMaintenanceRouteComponentProps = {
  loaderData: RulerMaintenancePageLoaderData
}

export function RulerMaintenanceRouteComponent({
  loaderData,
}: RulerMaintenanceRouteComponentProps) {
  return renderRulerMaintenancePage(loaderData)
}

export function renderRulerMaintenancePage(
  loaderData: RulerMaintenancePageLoaderData
) {
  return renderMaintenancePage(loaderData, ({ rulers, rulerGroups }) => (
    <main className="mt-8">
      <RulersTable rulers={rulers} rulerGroups={rulerGroups} />
    </main>
  ))
}
