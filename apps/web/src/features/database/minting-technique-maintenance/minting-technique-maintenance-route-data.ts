import type { MintingTechnique, MaintenanceApiClient } from "@coin-archive/api"
import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createMintingTechniqueAuthorizationError } from "./actions"

type LoadResult = MaintenancePageLoadResult<
  { mintingTechniques: MintingTechnique[] },
  ReturnType<typeof createMintingTechniqueAuthorizationError>
>

export type MintingTechniqueMaintenancePageLoaderData =
  MaintenancePageLoaderData<{
    mintingTechniques: MintingTechnique[]
  }>

type ReadDependencies = {
  listMintingTechniques: MaintenanceApiClient["mintingTechniques"]["list"]
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { listMintingTechniques: client.mintingTechniques.list }
}

export async function loadMintingTechniqueMaintenancePageData(
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  const { listMintingTechniques } =
    dependencies ?? (await getDefaultReadDependencies())
  const mintingTechniques: MintingTechnique[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await listMintingTechniques({
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

const getLoaderData = createServerFn({ method: "GET" }).handler(async () =>
  toMaintenancePageLoaderData(await loadMintingTechniqueMaintenancePageData())
)

export function loadMintingTechniqueMaintenanceRouteData() {
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
