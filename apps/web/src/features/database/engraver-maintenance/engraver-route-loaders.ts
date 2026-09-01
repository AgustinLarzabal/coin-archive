import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getEngraverMaintenanceReadDependencies,
  loadEngraverMaintenanceEngravers,
} from "./engraver-loaders.server"

const getEngraverMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () =>
  toMaintenancePageLoaderData(
    await loadEngraverMaintenanceEngravers(
      await getEngraverMaintenanceReadDependencies()
    )
  )
)

export function loadEngraverMaintenanceRouteData() {
  return getEngraverMaintenanceLoaderData()
}
