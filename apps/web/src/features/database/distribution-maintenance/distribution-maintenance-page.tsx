import { renderMaintenancePage } from "../maintenance-page"
import type { LoaderData } from "./distribution-maintenance-route-data"
import { DistributionsTable } from "./table-workflow/distributions-table"

type DistributionMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function DistributionMaintenanceRouteComponent({
  loaderData,
}: DistributionMaintenanceRouteComponentProps) {
  return renderDistributionMaintenancePage(loaderData)
}

export function renderDistributionMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ distributions }) => (
    <main className="mt-8">
      <DistributionsTable distributions={distributions} />
    </main>
  ))
}
