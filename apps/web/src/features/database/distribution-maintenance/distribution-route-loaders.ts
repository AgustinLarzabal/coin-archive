import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getDistributionMaintenanceReadDependencies,
  loadDistributionMaintenanceDistributions,
} from "./distribution-loaders.server"

const getDistributionMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () =>
  toMaintenancePageLoaderData(
    await loadDistributionMaintenanceDistributions(
      await getDistributionMaintenanceReadDependencies()
    )
  )
)

export function loadDistributionMaintenanceRouteData() {
  return getDistributionMaintenanceLoaderData()
}
