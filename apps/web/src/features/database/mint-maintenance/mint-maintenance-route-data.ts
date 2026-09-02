import type { Mint, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type MintMaintenancePageLoaderData = MaintenancePageLoaderData<{
  mints: Mint[]
}>

export type MintMaintenanceReadDependencies = {
  listMints: MaintenanceApiClient["mints"]["list"]
}
