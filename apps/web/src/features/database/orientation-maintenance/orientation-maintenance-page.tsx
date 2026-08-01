import { renderMaintenancePage } from "../maintenance-page"
import type { OrientationMaintenancePageLoaderData } from "./orientation-maintenance-route-data"
import { OrientationsTable } from "./table-workflow/orientations-table"

type OrientationMaintenanceRouteComponentProps = {
  loaderData: OrientationMaintenancePageLoaderData
}

export function OrientationMaintenanceRouteComponent({
  loaderData,
}: OrientationMaintenanceRouteComponentProps) {
  return renderMaintenancePage(loaderData, ({ orientations }) => (
    <main className="mt-8">
      <OrientationsTable orientations={orientations} />
    </main>
  ))
}
