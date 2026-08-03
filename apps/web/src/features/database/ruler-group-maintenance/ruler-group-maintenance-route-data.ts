import type { RulerGroup, MaintenanceApiClient } from "@coin-archive/api"
import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createRulerGroupAuthorizationError } from "./actions"

type LoadResult = MaintenancePageLoadResult<
  { rulerGroups: RulerGroup[] },
  ReturnType<typeof createRulerGroupAuthorizationError>
>

export type RulerGroupMaintenancePageLoaderData = MaintenancePageLoaderData<{
  rulerGroups: RulerGroup[]
}>

type ReadDependencies = {
  listRulerGroups: MaintenanceApiClient["rulerGroups"]["list"]
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { listRulerGroups: client.rulerGroups.list }
}

export async function loadRulerGroupMaintenancePageData(
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  const { listRulerGroups } =
    dependencies ?? (await getDefaultReadDependencies())
  const rulerGroups: RulerGroup[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await listRulerGroups({
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

const getLoaderData = createServerFn({ method: "GET" }).handler(async () =>
  toMaintenancePageLoaderData(await loadRulerGroupMaintenancePageData())
)

export function loadRulerGroupMaintenanceRouteData() {
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
