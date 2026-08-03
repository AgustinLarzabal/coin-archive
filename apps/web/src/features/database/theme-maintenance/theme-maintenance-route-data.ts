import type { Theme, MaintenanceApiClient } from "@coin-archive/api"
import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createThemeAuthorizationError } from "./actions"

type LoadResult = MaintenancePageLoadResult<
  { themes: Theme[] },
  ReturnType<typeof createThemeAuthorizationError>
>

export type ThemeMaintenancePageLoaderData = MaintenancePageLoaderData<{
  themes: Theme[]
}>

type ReadDependencies = {
  listThemes: MaintenanceApiClient["themes"]["list"]
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { listThemes: client.themes.list }
}

export async function loadThemeMaintenancePageData(
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  const { listThemes } = dependencies ?? (await getDefaultReadDependencies())
  const themes: Theme[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await listThemes({
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
    if (isAuthorizationProblem(error)) {
      return createThemeAuthorizationError()
    }
    throw error
  }

  return { status: "success", themes }
}

const getLoaderData = createServerFn({ method: "GET" }).handler(async () =>
  toMaintenancePageLoaderData(await loadThemeMaintenancePageData())
)

export function loadThemeMaintenanceRouteData() {
  return getLoaderData()
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
