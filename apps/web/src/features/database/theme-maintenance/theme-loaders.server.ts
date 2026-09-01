import type { Theme } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createThemeAuthorizationError } from "./actions"
import type { ThemeMaintenanceReadDependencies } from "./theme-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { themes: Theme[] },
  ReturnType<typeof createThemeAuthorizationError>
>

export async function getThemeMaintenanceReadDependencies(): Promise<ThemeMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listThemes: client.themes.list }
}

export async function loadThemeMaintenanceThemes(
  dependencies: ThemeMaintenanceReadDependencies
): Promise<LoadResult> {
  const themes: Theme[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listThemes({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      themes.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Theme maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) return createThemeAuthorizationError()
    throw error
  }

  return { status: "success", themes }
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
