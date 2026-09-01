import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getRulerGroupMaintenanceReadDependencies,
  loadRulerGroupMaintenanceRulerGroups,
} from "./ruler-group-loaders.server"

const getRulerGroupMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () =>
  toMaintenancePageLoaderData(
    await loadRulerGroupMaintenanceRulerGroups(
      await getRulerGroupMaintenanceReadDependencies()
    )
  )
)

export function loadRulerGroupMaintenanceRouteData() {
  return getRulerGroupMaintenanceLoaderData()
}
