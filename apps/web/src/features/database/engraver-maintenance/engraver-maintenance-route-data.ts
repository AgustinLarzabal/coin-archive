import type { Engraver, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type EngraverMaintenancePageLoaderData = MaintenancePageLoaderData<{
  engravers: Engraver[]
}>

export type EngraverMaintenanceReadDependencies = {
  listEngravers: MaintenanceApiClient["engravers"]["list"]
}
