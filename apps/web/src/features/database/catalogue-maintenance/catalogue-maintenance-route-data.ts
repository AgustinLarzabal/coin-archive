import type { Catalogue, MaintenanceApiClient } from "@coin-archive/api"
import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createCatalogueAuthorizationError } from "./actions"

type LoadResult = MaintenancePageLoadResult<
  { catalogues: Catalogue[] },
  ReturnType<typeof createCatalogueAuthorizationError>
>

export type CatalogueMaintenancePageLoaderData = MaintenancePageLoaderData<{
  catalogues: Catalogue[]
}>

type ReadDependencies = {
  listCatalogues: MaintenanceApiClient["catalogues"]["list"]
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { listCatalogues: client.catalogues.list }
}

export async function loadCatalogueMaintenancePageData(
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  const { listCatalogues } =
    dependencies ?? (await getDefaultReadDependencies())
  const catalogues: Catalogue[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await listCatalogues({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "title",
        order: "asc",
      })
      catalogues.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Catalogue maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) {
      return createCatalogueAuthorizationError()
    }
    throw error
  }

  return { status: "success", catalogues }
}

const getLoaderData = createServerFn({ method: "GET" }).handler(async () =>
  toMaintenancePageLoaderData(await loadCatalogueMaintenancePageData())
)

export function loadCatalogueMaintenanceRouteData() {
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
