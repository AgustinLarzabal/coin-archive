import { createServerFn } from "@tanstack/react-start"
import type {
  DatabaseMaintenanceOverview,
  MaintenanceApiClient,
} from "@coin-archive/api"

export type DatabaseOverviewPageLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      counts: DatabaseMaintenanceOverview
    }

type DatabaseOverviewDependencies = {
  getOverview: MaintenanceApiClient["overview"]["get"]
}

async function getDefaultDatabaseOverviewDependencies(): Promise<DatabaseOverviewDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()

  return {
    getOverview: client.overview.get,
  }
}

export async function loadDatabaseOverviewPageData(
  dependencies?: DatabaseOverviewDependencies
): Promise<DatabaseOverviewPageLoaderData> {
  const { getOverview } =
    dependencies ?? (await getDefaultDatabaseOverviewDependencies())

  try {
    const { data: counts } = await getOverview({})
    return { isAllowed: true, counts }
  } catch (error) {
    if (isAuthorizationProblem(error)) return { isAllowed: false }
    throw error
  }
}

const getDatabaseOverviewLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  return loadDatabaseOverviewPageData()
})

export function loadDatabaseOverviewRouteData() {
  return getDatabaseOverviewLoaderData()
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
