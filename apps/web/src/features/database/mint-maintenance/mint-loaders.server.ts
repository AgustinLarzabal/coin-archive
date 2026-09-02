import type { Mint } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createMintAuthorizationError } from "./actions"
import type { MintMaintenanceReadDependencies } from "./mint-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { mints: Mint[] },
  ReturnType<typeof createMintAuthorizationError>
>

export async function getMintMaintenanceReadDependencies(): Promise<MintMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listMints: client.mints.list }
}

export async function loadMintMaintenanceMints(
  dependencies: MintMaintenanceReadDependencies
): Promise<LoadResult> {
  const mints: Mint[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listMints({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      mints.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Mint maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) {
      return createMintAuthorizationError()
    }
    throw error
  }

  return { status: "success", mints }
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
