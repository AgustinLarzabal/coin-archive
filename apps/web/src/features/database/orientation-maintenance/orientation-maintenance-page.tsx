import { renderMaintenancePage } from "../maintenance-page"
import type { LoaderData } from "./orientation-maintenance-route-data"
import { OrientationsTable } from "./table-workflow/orientations-table"

type OrientationMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function OrientationMaintenanceRouteComponent({
  loaderData,
}: OrientationMaintenanceRouteComponentProps) {
  return renderOrientationMaintenancePage(loaderData)
}

export function renderOrientationMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ orientations }) => (
    <main className="mt-8">
      <OrientationsTable orientations={orientations} />
    </main>
  ))
}
