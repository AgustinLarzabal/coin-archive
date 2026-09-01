import type { Distribution } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createDistributionAuthorizationError } from "./actions"
import type { DistributionMaintenanceReadDependencies } from "./distribution-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { distributions: Distribution[] },
  ReturnType<typeof createDistributionAuthorizationError>
>

export async function getDistributionMaintenanceReadDependencies(): Promise<DistributionMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listDistributions: client.distributions.list }
}

export async function loadDistributionMaintenanceDistributions(
  dependencies: DistributionMaintenanceReadDependencies
): Promise<LoadResult> {
  const distributions: Distribution[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listDistributions({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      distributions.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Distribution maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) {
      return createDistributionAuthorizationError()
    }
    throw error
  }

  return { status: "success", distributions }
}

function isAuthorizationProblem(error: unknown) {
  if (typeof error !== "object" || error === null) return false
  if ("code" in error) {
    return error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN"
  }
  if (!("data" in error)) return false
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
