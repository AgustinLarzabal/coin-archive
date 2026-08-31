import type { MaintenanceApiClient, Rim } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type RimMaintenancePageLoaderData = MaintenancePageLoaderData<{
  rims: Rim[]
}>

export type RimMaintenanceReadDependencies = {
  listRims: MaintenanceApiClient["rims"]["list"]
}
