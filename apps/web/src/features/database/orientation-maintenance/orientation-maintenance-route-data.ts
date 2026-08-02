import type { MaintenanceApiClient, Orientation } from "@coin-archive/api"
import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createOrientationAuthorizationError } from "./actions"

type LoadResult = MaintenancePageLoadResult<
  {
    orientations: Orientation[]
  },
  ReturnType<typeof createOrientationAuthorizationError>
>

export type OrientationMaintenancePageLoaderData = MaintenancePageLoaderData<{
  orientations: Orientation[]
}>

type ReadDependencies = {
  listOrientations: MaintenanceApiClient["orientations"]["list"]
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()

  return {
    listOrientations: client.orientations.list,
  }
}

export async function loadOrientationMaintenanceOrientations(
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  const { listOrientations } =
    dependencies ?? (await getDefaultReadDependencies())
  const orientations: Orientation[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await listOrientations({
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

  return {
    status: "success",
    orientations,
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const result = await loadOrientationMaintenanceOrientations()

  return toMaintenancePageLoaderData(result)
})

export function loadOrientationMaintenanceRouteData() {
  return getLoaderData()
}

function isAuthorizationProblem(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN")
  )
}
