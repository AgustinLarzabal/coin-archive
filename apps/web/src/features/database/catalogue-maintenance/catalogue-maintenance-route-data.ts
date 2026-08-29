import type { Catalogue, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type CatalogueMaintenancePageLoaderData = MaintenancePageLoaderData<{
  catalogues: Catalogue[]
}>

export type CatalogueMaintenanceReadDependencies = {
  listCatalogues: MaintenanceApiClient["catalogues"]["list"]
}
