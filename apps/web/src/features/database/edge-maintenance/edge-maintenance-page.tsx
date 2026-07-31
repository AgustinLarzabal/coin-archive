import { renderMaintenancePage } from "../maintenance-page"
import type { LoaderData } from "./edge-maintenance-route-data"
import { EdgesTable } from "./table-workflow/edges-table"

type EdgeMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function EdgeMaintenanceRouteComponent({
  loaderData,
}: EdgeMaintenanceRouteComponentProps) {
  return renderEdgeMaintenancePage(loaderData)
}

export function renderEdgeMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ edges }) => (
    <main className="mt-8">
      <EdgesTable edges={edges} />
    </main>
  ))
}
