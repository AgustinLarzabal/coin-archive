import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getMintMaintenanceReadDependencies,
  loadMintMaintenanceMints,
} from "./mint-loaders.server"

const getMintMaintenanceLoaderData = createServerFn({ method: "GET" }).handler(
  async () =>
    toMaintenancePageLoaderData(
      await loadMintMaintenanceMints(await getMintMaintenanceReadDependencies())
    )
)

export function loadMintMaintenanceRouteData() {
  return getMintMaintenanceLoaderData()
}
