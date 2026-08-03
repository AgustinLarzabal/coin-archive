import type {
  MaintenanceApiClient,
  Ruler,
  RulerGroupOption,
} from "@coin-archive/api"
import { createServerFn } from "@tanstack/react-start"

import { loadAllMaintenanceOptions } from "@/lib/maintenance-options.server"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createRulerAuthorizationError } from "./actions"

type LoadResult = MaintenancePageLoadResult<
  { rulers: Ruler[]; rulerGroups: RulerGroupOption[] },
  ReturnType<typeof createRulerAuthorizationError>
>

export type RulerMaintenancePageLoaderData = MaintenancePageLoaderData<{
  rulers: Ruler[]
  rulerGroups: RulerGroupOption[]
}>

type ReadDependencies = {
  listRulers: MaintenanceApiClient["rulers"]["list"]
  listRulerGroups: MaintenanceApiClient["rulerGroups"]["options"]
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    listRulers: client.rulers.list,
    listRulerGroups: client.rulerGroups.options,
  }
}

export async function loadRulerMaintenancePageData(
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  const { listRulers, listRulerGroups } =
    dependencies ?? (await getDefaultReadDependencies())
  const rulers: Ruler[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await listRulers({
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

    const rulerGroups = await loadAllMaintenanceOptions(listRulerGroups)
    return { status: "success", rulers, rulerGroups }
  } catch (error) {
    if (isAuthorizationProblem(error)) {
      return createRulerAuthorizationError()
    }
    throw error
  }
}

const getLoaderData = createServerFn({ method: "GET" }).handler(async () =>
  toMaintenancePageLoaderData(await loadRulerMaintenancePageData())
)

export function loadRulerMaintenanceRouteData() {
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
