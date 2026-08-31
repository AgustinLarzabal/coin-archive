import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getEdgeMaintenanceReadDependencies,
  loadEdgeMaintenanceEdges,
} from "./edge-loaders.server"

const getEdgeMaintenanceLoaderData = createServerFn({ method: "GET" }).handler(
  async () =>
    toMaintenancePageLoaderData(
      await loadEdgeMaintenanceEdges(await getEdgeMaintenanceReadDependencies())
    )
)

export function loadEdgeMaintenanceRouteData() {
  return getEdgeMaintenanceLoaderData()
}
