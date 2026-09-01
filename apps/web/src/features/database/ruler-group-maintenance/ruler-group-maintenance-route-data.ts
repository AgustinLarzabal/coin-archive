import type { RulerGroup, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type RulerGroupMaintenancePageLoaderData = MaintenancePageLoaderData<{
  rulerGroups: RulerGroup[]
}>

export type RulerGroupMaintenanceReadDependencies = {
  listRulerGroups: MaintenanceApiClient["rulerGroups"]["list"]
}
