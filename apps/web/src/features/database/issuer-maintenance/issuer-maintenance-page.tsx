import { renderMaintenancePage } from "../maintenance-page"
import type { IssuerMaintenancePageLoaderData } from "./issuer-maintenance-route-data"
import { IssuersTable } from "./table-workflow/issuers-table"

type IssuerMaintenanceRouteComponentProps = {
  loaderData: IssuerMaintenancePageLoaderData
}

export function IssuerMaintenanceRouteComponent({
  loaderData,
}: IssuerMaintenanceRouteComponentProps) {
  return renderIssuerMaintenancePage(loaderData)
}

export function renderIssuerMaintenancePage(
  loaderData: IssuerMaintenancePageLoaderData
) {
  return renderMaintenancePage(loaderData, ({ issuers }) => (
    <main className="mt-8">
      <IssuersTable issuers={issuers} />
    </main>
  ))
}
