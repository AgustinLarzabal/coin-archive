import type { MintingTechnique, MaintenanceApiClient } from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type MintingTechniqueMaintenancePageLoaderData =
  MaintenancePageLoaderData<{
    mintingTechniques: MintingTechnique[]
  }>

export type MintingTechniqueMaintenanceReadDependencies = {
  listMintingTechniques: MaintenanceApiClient["mintingTechniques"]["list"]
}
