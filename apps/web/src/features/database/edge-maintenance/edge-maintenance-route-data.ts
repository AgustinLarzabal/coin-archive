import type { Edge, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type EdgeMaintenancePageLoaderData = MaintenancePageLoaderData<{
  edges: Edge[]
}>

export type EdgeMaintenanceReadDependencies = {
  listEdges: MaintenanceApiClient["edges"]["list"]
}
