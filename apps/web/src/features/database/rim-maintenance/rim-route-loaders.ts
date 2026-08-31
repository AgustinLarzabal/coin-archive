import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getRimMaintenanceReadDependencies,
  loadRimMaintenanceRims,
} from "./rim-loaders.server"

const getRimMaintenanceLoaderData = createServerFn({ method: "GET" }).handler(
  async () =>
    toMaintenancePageLoaderData(
      await loadRimMaintenanceRims(await getRimMaintenanceReadDependencies())
    )
)

export function loadRimMaintenanceRouteData() {
  return getRimMaintenanceLoaderData()
}
