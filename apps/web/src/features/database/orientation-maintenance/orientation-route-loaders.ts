import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getOrientationMaintenanceReadDependencies,
  loadOrientationMaintenanceOrientations,
} from "./orientation-loaders.server"

const getOrientationMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () =>
  toMaintenancePageLoaderData(
    await loadOrientationMaintenanceOrientations(
      await getOrientationMaintenanceReadDependencies()
    )
  )
)

export function loadOrientationMaintenanceRouteData() {
  return getOrientationMaintenanceLoaderData()
}
