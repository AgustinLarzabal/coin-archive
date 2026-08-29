import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getCatalogueMaintenanceReadDependencies,
  loadCatalogueMaintenancePageData,
} from "./catalogue-loaders.server"

const getCatalogueMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () =>
  toMaintenancePageLoaderData(
    await loadCatalogueMaintenancePageData(
      await getCatalogueMaintenanceReadDependencies()
    )
  )
)

export function loadCatalogueMaintenanceRouteData() {
  return getCatalogueMaintenanceLoaderData()
}
