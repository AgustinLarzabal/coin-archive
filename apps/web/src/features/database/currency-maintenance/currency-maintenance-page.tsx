import { renderMaintenancePage } from "../maintenance-page"
import type { CurrencyMaintenancePageLoaderData } from "./currency-maintenance-route-data"
import { CurrenciesTable } from "./table-workflow/currencies-table"

type CurrencyMaintenanceRouteComponentProps = {
  loaderData: CurrencyMaintenancePageLoaderData
}

export function CurrencyMaintenanceRouteComponent({
  loaderData,
}: CurrencyMaintenanceRouteComponentProps) {
  return renderCurrencyMaintenancePage(loaderData)
}

export function renderCurrencyMaintenancePage(
  loaderData: CurrencyMaintenancePageLoaderData
) {
  return renderMaintenancePage(loaderData, ({ currencies }) => (
    <main className="mt-8">
      <CurrenciesTable currencies={currencies} />
    </main>
  ))
}
