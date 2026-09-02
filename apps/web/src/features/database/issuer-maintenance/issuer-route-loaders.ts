import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getIssuerMaintenanceReadDependencies,
  loadIssuerMaintenancePageData,
} from "./issuer-loaders.server"

const getIssuerMaintenanceLoaderData = createServerFn({ method: "GET" }).handler(
  async () =>
    toMaintenancePageLoaderData(
      await loadIssuerMaintenancePageData(
        await getIssuerMaintenanceReadDependencies()
      )
    )
)

export function loadIssuerMaintenanceRouteData() {
  return getIssuerMaintenanceLoaderData()
}
