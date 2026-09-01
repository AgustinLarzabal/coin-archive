import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getThemeMaintenanceReadDependencies,
  loadThemeMaintenanceThemes,
} from "./theme-loaders.server"

const getThemeMaintenanceLoaderData = createServerFn({ method: "GET" }).handler(
  async () =>
    toMaintenancePageLoaderData(
      await loadThemeMaintenanceThemes(
        await getThemeMaintenanceReadDependencies()
      )
    )
)

export function loadThemeMaintenanceRouteData() {
  return getThemeMaintenanceLoaderData()
}
