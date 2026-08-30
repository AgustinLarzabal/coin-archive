import type { Shape } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { createShapeAuthorizationError } from "./actions"
import type { ShapeMaintenanceReadDependencies } from "./shape-maintenance-route-data"
import type { MaintenancePageLoadResult } from "../maintenance-page"

type LoadResult = MaintenancePageLoadResult<
  { shapes: Shape[] },
  ReturnType<typeof createShapeAuthorizationError>
>

export async function getShapeMaintenanceReadDependencies(): Promise<ShapeMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listShapes: client.shapes.list }
}

export async function loadShapeMaintenanceShapes(
  dependencies: ShapeMaintenanceReadDependencies
): Promise<LoadResult> {
  const shapes: Shape[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listShapes({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      shapes.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Shape maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) return createShapeAuthorizationError()
    throw error
  }

  return { status: "success", shapes }
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
