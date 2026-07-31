import { renderMaintenancePage } from "../maintenance-page"
import type { DistributionMaintenancePageLoaderData } from "./distribution-maintenance-route-data"
import { DistributionsTable } from "./table-workflow/distributions-table"

type DistributionMaintenanceRouteComponentProps = {
  loaderData: DistributionMaintenancePageLoaderData
}

export function DistributionMaintenanceRouteComponent({
  loaderData,
}: DistributionMaintenanceRouteComponentProps) {
  return renderDistributionMaintenancePage(loaderData)
}

export function renderDistributionMaintenancePage(
  loaderData: DistributionMaintenancePageLoaderData
) {
  return renderMaintenancePage(loaderData, ({ distributions }) => (
    <main className="mt-8">
      <DistributionsTable distributions={distributions} />
    </main>
  ))
}
