import type { Theme, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type ThemeMaintenancePageLoaderData = MaintenancePageLoaderData<{
  themes: Theme[]
}>

export type ThemeMaintenanceReadDependencies = {
  listThemes: MaintenanceApiClient["themes"]["list"]
}
