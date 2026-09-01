import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getMintingTechniqueMaintenanceReadDependencies,
  loadMintingTechniqueMaintenanceTechniques,
} from "./minting-technique-loaders.server"

const getMintingTechniqueMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () =>
  toMaintenancePageLoaderData(
    await loadMintingTechniqueMaintenanceTechniques(
      await getMintingTechniqueMaintenanceReadDependencies()
    )
  )
)

export function loadMintingTechniqueMaintenanceRouteData() {
  return getMintingTechniqueMaintenanceLoaderData()
}
