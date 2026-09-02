import type { Issuer } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createIssuerAuthorizationError } from "./actions"
import { getIssuerProblemBody } from "./issuer-api-problem"
import type {
  IssuerMaintenanceReadDependencies,
  IssuerMaintenanceRecord,
} from "./issuer-maintenance-route-data"
import { toIssuerMaintenanceRecords } from "./issuer-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { issuers: IssuerMaintenanceRecord[] },
  ReturnType<typeof createIssuerAuthorizationError>
>

export async function getIssuerMaintenanceReadDependencies(): Promise<IssuerMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listIssuers: client.issuers.list }
}

export async function loadIssuerMaintenancePageData(
  dependencies: IssuerMaintenanceReadDependencies
): Promise<LoadResult> {
  const issuers: Issuer[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listIssuers({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      issuers.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Issuer maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) return createIssuerAuthorizationError()
    throw error
  }

  return { status: "success", issuers: toIssuerMaintenanceRecords(issuers) }
}

function isAuthorizationProblem(error: unknown) {
  const body = getIssuerProblemBody(error)
  return (
    body !== undefined &&
    (body.code === "authentication_required" ||
      body.code === "editor_access_required")
  )
}
