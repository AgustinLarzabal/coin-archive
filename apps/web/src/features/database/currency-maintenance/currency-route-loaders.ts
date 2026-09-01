import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getCurrencyMaintenanceReadDependencies,
  loadCurrencyMaintenanceCurrencies,
} from "./currency-loaders.server"

const getCurrencyMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () =>
  toMaintenancePageLoaderData(
    await loadCurrencyMaintenanceCurrencies(
      await getCurrencyMaintenanceReadDependencies()
    )
  )
)

export function loadCurrencyMaintenanceRouteData() {
  return getCurrencyMaintenanceLoaderData()
}
