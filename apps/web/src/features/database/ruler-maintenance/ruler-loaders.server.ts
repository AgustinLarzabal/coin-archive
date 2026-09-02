import type { Ruler, RulerGroupOption } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"
import { loadAllMaintenanceOptions } from "@/lib/maintenance-options"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createRulerAuthorizationError } from "./actions"
import type { RulerMaintenanceReadDependencies } from "./ruler-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { rulers: Ruler[]; rulerGroups: RulerGroupOption[] },
  ReturnType<typeof createRulerAuthorizationError>
>

export async function getRulerMaintenanceReadDependencies(): Promise<RulerMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return {
    listRulers: client.rulers.list,
    listRulerGroups: client.rulerGroups.options,
  }
}

export async function loadRulerMaintenancePageData(
  dependencies: RulerMaintenanceReadDependencies
): Promise<LoadResult> {
  const rulers: Ruler[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listRulers({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      rulers.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Ruler maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)

    const rulerGroups = await loadAllMaintenanceOptions(
      dependencies.listRulerGroups
    )
    return { status: "success", rulers, rulerGroups }
  } catch (error) {
    if (isAuthorizationProblem(error)) {
      return createRulerAuthorizationError()
    }
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
