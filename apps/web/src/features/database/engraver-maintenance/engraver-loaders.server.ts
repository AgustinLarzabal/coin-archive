import type { Engraver } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createEngraverAuthorizationError } from "./actions"
import type { EngraverMaintenanceReadDependencies } from "./engraver-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { engravers: Engraver[] },
  ReturnType<typeof createEngraverAuthorizationError>
>

export async function getEngraverMaintenanceReadDependencies(): Promise<EngraverMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listEngravers: client.engravers.list }
}

export async function loadEngraverMaintenanceEngravers(
  dependencies: EngraverMaintenanceReadDependencies
): Promise<LoadResult> {
  const engravers: Engraver[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listEngravers({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      engravers.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Engraver maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) return createEngraverAuthorizationError()
    throw error
  }

  return { status: "success", engravers }
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
