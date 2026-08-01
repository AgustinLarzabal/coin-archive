import { renderMaintenancePage } from "../../maintenance-page"
import type { CoinMaintenancePageLoaderData } from "./coin-maintenance-route-data"
import { CoinsMaintenanceTable } from "./coins-maintenance-table"

type CoinMaintenanceRouteComponentProps = {
  loaderData: CoinMaintenancePageLoaderData
}

export function CoinMaintenanceRouteComponent({
  loaderData,
}: CoinMaintenanceRouteComponentProps) {
  return renderMaintenancePage(
    loaderData,
    ({ search, list, filterOptions }) => (
      <main className="mt-8">
        <CoinsMaintenanceTable
          search={search}
          list={list}
          filterOptions={filterOptions}
        />
      </main>
    )
  )
}
