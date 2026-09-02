import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getRulerMaintenanceReadDependencies,
  loadRulerMaintenancePageData,
} from "./ruler-loaders.server"

const getRulerMaintenanceLoaderData = createServerFn({ method: "GET" }).handler(
  async () =>
    toMaintenancePageLoaderData(
      await loadRulerMaintenancePageData(
        await getRulerMaintenanceReadDependencies()
      )
    )
)

export function loadRulerMaintenanceRouteData() {
  return getRulerMaintenanceLoaderData()
}
