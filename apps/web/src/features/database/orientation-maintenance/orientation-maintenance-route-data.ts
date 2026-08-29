import type { MaintenanceApiClient, Orientation } from "@coin-archive/api"
import type { MaintenancePageLoaderData } from "../maintenance-page"

export type OrientationMaintenancePageLoaderData = MaintenancePageLoaderData<{
  orientations: Orientation[]
}>

export type OrientationMaintenanceReadDependencies = {
  listOrientations: MaintenanceApiClient["orientations"]["list"]
}
