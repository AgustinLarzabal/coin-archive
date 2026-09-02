import { createServerFn } from "@tanstack/react-start"

import {
  getDatabaseOverviewReadDependencies,
  loadDatabaseOverviewPageData,
} from "./database-overview-loaders.server"

const getDatabaseOverviewLoaderData = createServerFn({
  method: "GET",
}).handler(async () =>
  loadDatabaseOverviewPageData(await getDatabaseOverviewReadDependencies())
)

export function loadDatabaseOverviewRouteData() {
  return getDatabaseOverviewLoaderData()
}
