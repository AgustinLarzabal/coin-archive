import type { Orientation } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { createOrientationAuthorizationError } from "./actions"
import type { OrientationMaintenanceReadDependencies } from "./orientation-maintenance-route-data"
import type { MaintenancePageLoadResult } from "../maintenance-page"

type LoadResult = MaintenancePageLoadResult<
  { orientations: Orientation[] },
  ReturnType<typeof createOrientationAuthorizationError>
>

export async function getOrientationMaintenanceReadDependencies(): Promise<OrientationMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listOrientations: client.orientations.list }
}

export async function loadOrientationMaintenanceOrientations(
  dependencies: OrientationMaintenanceReadDependencies
): Promise<LoadResult> {
  const orientations: Orientation[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listOrientations({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      orientations.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Orientation maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) {
      return createOrientationAuthorizationError()
    }
    throw error
  }

  return { status: "success", orientations }
}

function isAuthorizationProblem(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN")
  )
}
