import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getCompositionMaintenanceReadDependencies,
  loadCompositionMaintenanceCompositions,
} from "./composition-loaders.server"

const getCompositionMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () =>
  toMaintenancePageLoaderData(
    await loadCompositionMaintenanceCompositions(
      await getCompositionMaintenanceReadDependencies()
    )
  )
)

export function loadCompositionMaintenanceRouteData() {
  return getCompositionMaintenanceLoaderData()
}
