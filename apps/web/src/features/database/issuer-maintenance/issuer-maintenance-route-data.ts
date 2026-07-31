import { createServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"

type LoadIssuerMaintenancePageDataResult = MaintenancePageLoadResult<{
  issuers: IssuerMaintenanceRecord[]
}>

export type IssuerMaintenancePageLoaderData = MaintenancePageLoaderData<{
  issuers: IssuerMaintenanceRecord[]
}>

type IssuerMaintenanceReadDependencies = {
  getIssuerMaintenanceRecords: () => Promise<IssuerMaintenanceRecord[]>
}

async function getDefaultIssuerReadDependencies(): Promise<IssuerMaintenanceReadDependencies> {
  const { getIssuerMaintenanceRecords } = await import("@coin-archive/db")

  return {
    getIssuerMaintenanceRecords,
  }
}

export async function loadIssuerMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: IssuerMaintenanceReadDependencies
): Promise<LoadIssuerMaintenancePageDataResult> {
  if (!getEditorRouteAuthorization(collector).isAllowed) {
    return {
      status: "error",
    }
  }

  const { getIssuerMaintenanceRecords } =
    dependencies ?? (await getDefaultIssuerReadDependencies())

  return {
    status: "success",
    issuers: await getIssuerMaintenanceRecords(),
  }
}

const getIssuerMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadIssuerMaintenancePageData(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadIssuerMaintenanceRouteData() {
  return getIssuerMaintenanceLoaderData()
}
