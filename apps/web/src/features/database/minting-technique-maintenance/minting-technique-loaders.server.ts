import type { MintingTechnique } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createMintingTechniqueAuthorizationError } from "./actions"
import type { MintingTechniqueMaintenanceReadDependencies } from "./minting-technique-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { mintingTechniques: MintingTechnique[] },
  ReturnType<typeof createMintingTechniqueAuthorizationError>
>

export async function getMintingTechniqueMaintenanceReadDependencies(): Promise<MintingTechniqueMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listMintingTechniques: client.mintingTechniques.list }
}

export async function loadMintingTechniqueMaintenanceTechniques(
  dependencies: MintingTechniqueMaintenanceReadDependencies
): Promise<LoadResult> {
  const mintingTechniques: MintingTechnique[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listMintingTechniques({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      mintingTechniques.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Minting Technique maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) {
      return createMintingTechniqueAuthorizationError()
    }
    throw error
  }

  return { status: "success", mintingTechniques }
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
