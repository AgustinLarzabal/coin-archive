import type { Rim } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createRimAuthorizationError } from "./actions"
import type { RimMaintenanceReadDependencies } from "./rim-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { rims: Rim[] },
  ReturnType<typeof createRimAuthorizationError>
>

export async function getRimMaintenanceReadDependencies(): Promise<RimMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listRims: client.rims.list }
}

export async function loadRimMaintenanceRims(
  dependencies: RimMaintenanceReadDependencies
): Promise<LoadResult> {
  const rims: Rim[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listRims({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      rims.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Rim maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) return createRimAuthorizationError()
    throw error
  }

  return { status: "success", rims }
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
