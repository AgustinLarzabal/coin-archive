import type { Catalogue } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { createCatalogueAuthorizationError } from "./actions"
import type { CatalogueMaintenanceReadDependencies } from "./catalogue-maintenance-route-data"
import type { MaintenancePageLoadResult } from "../maintenance-page"

type LoadResult = MaintenancePageLoadResult<
  { catalogues: Catalogue[] },
  ReturnType<typeof createCatalogueAuthorizationError>
>

export async function getCatalogueMaintenanceReadDependencies(): Promise<CatalogueMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listCatalogues: client.catalogues.list }
}

export async function loadCatalogueMaintenancePageData(
  dependencies: CatalogueMaintenanceReadDependencies
): Promise<LoadResult> {
  const catalogues: Catalogue[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listCatalogues({
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

function isAuthorizationProblem(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN")
  )
}
