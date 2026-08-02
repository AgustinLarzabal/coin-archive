import type { Distribution, MaintenanceApiClient } from "@coin-archive/api"
import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createDistributionAuthorizationError } from "./actions"

type LoadResult = MaintenancePageLoadResult<
  { distributions: Distribution[] },
  ReturnType<typeof createDistributionAuthorizationError>
>

export type DistributionMaintenancePageLoaderData = MaintenancePageLoaderData<{
  distributions: Distribution[]
}>

type ReadDependencies = {
  listDistributions: MaintenanceApiClient["distributions"]["list"]
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { listDistributions: client.distributions.list }
}

export async function loadDistributionMaintenancePageData(
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  const { listDistributions } =
    dependencies ?? (await getDefaultReadDependencies())
  const distributions: Distribution[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await listDistributions({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      distributions.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Distribution maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) {
      return createDistributionAuthorizationError()
    }
    throw error
  }

  return { status: "success", distributions }
}

const getLoaderData = createServerFn({ method: "GET" }).handler(async () =>
  toMaintenancePageLoaderData(await loadDistributionMaintenancePageData())
)

export function loadDistributionMaintenanceRouteData() {
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
