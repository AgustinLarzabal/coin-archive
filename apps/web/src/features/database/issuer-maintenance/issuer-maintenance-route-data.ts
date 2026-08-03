import type { Issuer, MaintenanceApiClient } from "@coin-archive/api"
import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createIssuerAuthorizationError } from "./actions"
import { getIssuerProblemBody } from "./issuer-api-problem"

type LoadResult = MaintenancePageLoadResult<
  { issuers: IssuerMaintenanceRecord[] },
  ReturnType<typeof createIssuerAuthorizationError>
>

export type IssuerMaintenancePageLoaderData = MaintenancePageLoaderData<{
  issuers: IssuerMaintenanceRecord[]
}>

export type IssuerMaintenanceRecord = Pick<
  Issuer,
  "id" | "code" | "isoCode" | "name" | "etag"
> & {
  parent: Pick<Issuer, "id" | "code" | "name"> | null
}

type ReadDependencies = {
  listIssuers: MaintenanceApiClient["issuers"]["list"]
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { listIssuers: client.issuers.list }
}

export async function loadIssuerMaintenancePageData(
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  const { listIssuers } = dependencies ?? (await getDefaultReadDependencies())
  const issuers: Issuer[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await listIssuers({
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
    if (isAuthorizationProblem(error)) {
      return createIssuerAuthorizationError()
    }
    throw error
  }

  return { status: "success", issuers: toIssuerMaintenanceRecords(issuers) }
}

function toIssuerMaintenanceRecords(
  issuers: Issuer[]
): IssuerMaintenanceRecord[] {
  const issuersById = new Map(issuers.map((issuer) => [issuer.id, issuer]))

  return issuers.map((issuer) => {
    const parent =
      issuer.parentIssuerId === null
        ? undefined
        : issuersById.get(issuer.parentIssuerId)

    return {
      id: issuer.id,
      code: issuer.code,
      isoCode: issuer.isoCode,
      name: issuer.name,
      etag: issuer.etag,
      parent: parent
        ? { id: parent.id, code: parent.code, name: parent.name }
        : null,
    }
  })
}

const getLoaderData = createServerFn({ method: "GET" }).handler(async () =>
  toMaintenancePageLoaderData(await loadIssuerMaintenancePageData())
)

export function loadIssuerMaintenanceRouteData() {
  return getLoaderData()
}

function isAuthorizationProblem(error: unknown) {
  const body = getIssuerProblemBody(error)
  return (
    body !== undefined &&
    (body.code === "authentication_required" ||
      body.code === "editor_access_required")
  )
}
