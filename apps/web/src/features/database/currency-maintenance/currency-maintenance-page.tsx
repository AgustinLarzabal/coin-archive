import { renderMaintenancePage } from "../maintenance-page"
import type { LoaderData } from "./currency-maintenance-route-data"
import { CurrenciesTable } from "./table-workflow/currencies-table"

type CurrencyMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function CurrencyMaintenanceRouteComponent({
  loaderData,
}: CurrencyMaintenanceRouteComponentProps) {
  return renderCurrencyMaintenancePage(loaderData)
}

export function renderCurrencyMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ currencies }) => (
    <main className="mt-8">
      <CurrenciesTable currencies={currencies} />
    </main>
  ))
}
