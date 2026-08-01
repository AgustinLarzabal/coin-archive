import { renderMaintenancePage } from "../maintenance-page"
import type { EdgeMaintenancePageLoaderData } from "./edge-maintenance-route-data"
import { EdgesTable } from "./table-workflow/edges-table"

type EdgeMaintenanceRouteComponentProps = {
  loaderData: EdgeMaintenancePageLoaderData
}

export function EdgeMaintenanceRouteComponent({
  loaderData,
}: EdgeMaintenanceRouteComponentProps) {
  return renderMaintenancePage(loaderData, ({ edges }) => (
    <main className="mt-8">
      <EdgesTable edges={edges} />
    </main>
  ))
}
