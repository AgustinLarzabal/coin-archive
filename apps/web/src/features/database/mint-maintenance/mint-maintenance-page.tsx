import { renderMaintenancePage } from "../maintenance-page"
import type { MintMaintenancePageLoaderData } from "./mint-maintenance-route-data"
import { MintsTable } from "./table-workflow/mints-table"

type MintMaintenanceRouteComponentProps = {
  loaderData: MintMaintenancePageLoaderData
}

export function MintMaintenanceRouteComponent({
  loaderData,
}: MintMaintenanceRouteComponentProps) {
  return renderMintMaintenancePage(loaderData)
}

export function renderMintMaintenancePage(
  loaderData: MintMaintenancePageLoaderData
) {
  return renderMaintenancePage(loaderData, ({ mints }) => (
    <main className="mt-8">
      <MintsTable mints={mints} />
    </main>
  ))
}
