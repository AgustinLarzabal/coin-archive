import type { Composition } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createCompositionAuthorizationError } from "./actions"
import type { CompositionMaintenanceReadDependencies } from "./composition-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { compositions: Composition[] },
  ReturnType<typeof createCompositionAuthorizationError>
>

export async function getCompositionMaintenanceReadDependencies(): Promise<CompositionMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listCompositions: client.compositions.list }
}

export async function loadCompositionMaintenanceCompositions(
  dependencies: CompositionMaintenanceReadDependencies
): Promise<LoadResult> {
  const compositions: Composition[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listCompositions({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      compositions.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Composition maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error))
      return createCompositionAuthorizationError()
    throw error
  }

  return { status: "success", compositions }
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
