import { renderMaintenancePage } from "../maintenance-page"
import type { RimMaintenancePageLoaderData } from "./rim-maintenance-route-data"
import { RimsTable } from "./table-workflow/rims-table"

type RimMaintenanceRouteComponentProps = {
  loaderData: RimMaintenancePageLoaderData
}

export function RimMaintenanceRouteComponent({
  loaderData,
}: RimMaintenanceRouteComponentProps) {
  return renderMaintenancePage(loaderData, ({ rims }) => (
    <main className="mt-8">
      <RimsTable rims={rims} />
    </main>
  ))
}
