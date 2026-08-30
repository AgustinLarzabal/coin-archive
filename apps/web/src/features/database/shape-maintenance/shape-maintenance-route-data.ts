import type { MaintenanceApiClient, Shape } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type ShapeMaintenancePageLoaderData = MaintenancePageLoaderData<{
  shapes: Shape[]
}>

export type ShapeMaintenanceReadDependencies = {
  listShapes: MaintenanceApiClient["shapes"]["list"]
}
