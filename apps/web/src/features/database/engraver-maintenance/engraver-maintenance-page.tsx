import { renderMaintenancePage } from "../maintenance-page"
import type { EngraverMaintenancePageLoaderData } from "./engraver-maintenance-route-data"
import { EngraversTable } from "./table-workflow/engravers-table"

type EngraverMaintenanceRouteComponentProps = {
  loaderData: EngraverMaintenancePageLoaderData
}

export function EngraverMaintenanceRouteComponent({
  loaderData,
}: EngraverMaintenanceRouteComponentProps) {
  return renderMaintenancePage(loaderData, ({ engravers }) => (
    <main className="mt-8">
      <EngraversTable engravers={engravers} />
    </main>
  ))
}
