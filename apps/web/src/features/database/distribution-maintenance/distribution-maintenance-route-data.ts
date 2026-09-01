import type { Distribution, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type DistributionMaintenancePageLoaderData = MaintenancePageLoaderData<{
  distributions: Distribution[]
}>

export type DistributionMaintenanceReadDependencies = {
  listDistributions: MaintenanceApiClient["distributions"]["list"]
}
