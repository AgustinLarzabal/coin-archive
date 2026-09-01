import type { RulerGroup } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createRulerGroupAuthorizationError } from "./actions"
import type { RulerGroupMaintenanceReadDependencies } from "./ruler-group-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { rulerGroups: RulerGroup[] },
  ReturnType<typeof createRulerGroupAuthorizationError>
>

export async function getRulerGroupMaintenanceReadDependencies(): Promise<RulerGroupMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listRulerGroups: client.rulerGroups.list }
}

export async function loadRulerGroupMaintenanceRulerGroups(
  dependencies: RulerGroupMaintenanceReadDependencies
): Promise<LoadResult> {
  const rulerGroups: RulerGroup[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listRulerGroups({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      rulerGroups.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Ruler Group maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) {
      return createRulerGroupAuthorizationError()
    }
    throw error
  }

  return { status: "success", rulerGroups }
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
