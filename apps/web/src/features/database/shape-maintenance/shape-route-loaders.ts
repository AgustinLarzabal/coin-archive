import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getShapeMaintenanceReadDependencies,
  loadShapeMaintenanceShapes,
} from "./shape-loaders.server"

const getShapeMaintenanceLoaderData = createServerFn({ method: "GET" }).handler(
  async () =>
    toMaintenancePageLoaderData(
      await loadShapeMaintenanceShapes(
        await getShapeMaintenanceReadDependencies()
      )
    )
)

export function loadShapeMaintenanceRouteData() {
  return getShapeMaintenanceLoaderData()
}
