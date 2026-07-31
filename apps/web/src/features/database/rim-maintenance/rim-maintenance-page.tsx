import { renderMaintenancePage } from "../maintenance-page"
import type { LoaderData } from "./rim-maintenance-route-data"
import { RimsTable } from "./table-workflow/rims-table"

type RimMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function RimMaintenanceRouteComponent({
  loaderData,
}: RimMaintenanceRouteComponentProps) {
  return renderRimMaintenancePage(loaderData)
}

export function renderRimMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ rims }) => (
    <main className="mt-8">
      <RimsTable rims={rims} />
    </main>
  ))
}
