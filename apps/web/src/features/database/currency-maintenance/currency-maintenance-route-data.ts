import type { Currency, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type CurrencyMaintenancePageLoaderData = MaintenancePageLoaderData<{
  currencies: Currency[]
}>

export type CurrencyMaintenanceReadDependencies = {
  listCurrencies: MaintenanceApiClient["currencies"]["list"]
}
