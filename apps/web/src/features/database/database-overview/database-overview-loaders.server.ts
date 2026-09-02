import type {
  DatabaseMaintenanceOverview,
  MaintenanceApiClient,
} from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

export type DatabaseOverviewPageLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      counts: DatabaseMaintenanceOverview
    }

export type DatabaseOverviewReadDependencies = {
  getOverview: MaintenanceApiClient["overview"]["get"]
}

export async function getDatabaseOverviewReadDependencies(): Promise<DatabaseOverviewReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { getOverview: client.overview.get }
}

export async function loadDatabaseOverviewPageData(
  dependencies: DatabaseOverviewReadDependencies
): Promise<DatabaseOverviewPageLoaderData> {
  try {
    const { data: counts } = await dependencies.getOverview({})
    return { isAllowed: true, counts }
  } catch (error) {
    if (isAuthorizationProblem(error)) return { isAllowed: false }
    throw error
  }
}

function isAuthorizationProblem(error: unknown) {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return false
  }
  const data = error.data
  if (typeof data !== "object" || data === null || !("body" in data)) {
    return false
  }
  const body = data.body
  return (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    (body.code === "authentication_required" ||
      body.code === "editor_access_required")
  )
}
