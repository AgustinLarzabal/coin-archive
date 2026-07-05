import { createFileRoute } from "@tanstack/react-router"
import {
  CurrencyMaintenanceRouteComponent,
  loadCurrencyMaintenanceRouteData,
} from "@/features/database/currency-maintenance"

export const Route = createFileRoute("/_app/_authed/database/currencies")({
  loader: loadCurrencyMaintenanceRouteData,
  component: DatabaseCurrenciesComponent,
})

function DatabaseCurrenciesComponent() {
  return <CurrencyMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
}
