import type { Composition, MaintenanceApiClient } from "@coin-archive/api"
import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createCompositionAuthorizationError } from "./actions"

type LoadResult = MaintenancePageLoadResult<
  { compositions: Composition[] },
  ReturnType<typeof createCompositionAuthorizationError>
>

export type CompositionMaintenancePageLoaderData = MaintenancePageLoaderData<{
  compositions: Composition[]
}>

type ReadDependencies = {
  listCompositions: MaintenanceApiClient["compositions"]["list"]
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { listCompositions: client.compositions.list }
}

export async function loadCompositionMaintenancePageData(
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  const { listCompositions } =
    dependencies ?? (await getDefaultReadDependencies())
  const compositions: Composition[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await listCompositions({
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
    if (isAuthorizationProblem(error)) {
      return createCompositionAuthorizationError()
    }
    throw error
  }

  return { status: "success", compositions }
}

const getLoaderData = createServerFn({ method: "GET" }).handler(async () =>
  toMaintenancePageLoaderData(await loadCompositionMaintenancePageData())
)

export function loadCompositionMaintenanceRouteData() {
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
