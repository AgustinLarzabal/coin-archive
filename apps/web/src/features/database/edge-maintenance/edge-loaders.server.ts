import type { Edge } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createEdgeAuthorizationError } from "./actions"
import type { EdgeMaintenanceReadDependencies } from "./edge-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { edges: Edge[] },
  ReturnType<typeof createEdgeAuthorizationError>
>

export async function getEdgeMaintenanceReadDependencies(): Promise<EdgeMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listEdges: client.edges.list }
}

export async function loadEdgeMaintenanceEdges(
  dependencies: EdgeMaintenanceReadDependencies
): Promise<LoadResult> {
  const edges: Edge[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listEdges({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      edges.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Edge maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) return createEdgeAuthorizationError()
    throw error
  }

  return { status: "success", edges }
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
