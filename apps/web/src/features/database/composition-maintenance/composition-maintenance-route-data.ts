import type { Composition, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type CompositionMaintenancePageLoaderData = MaintenancePageLoaderData<{
  compositions: Composition[]
}>

export type CompositionMaintenanceReadDependencies = {
  listCompositions: MaintenanceApiClient["compositions"]["list"]
}
