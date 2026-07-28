import { createServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "@workspace/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

import {
  renderMaintenancePage,
  toMaintenancePageLoaderData,
} from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { IssuersTable } from "./table-workflow/issuers-table"

type LoadIssuerMaintenancePageDataResult = MaintenancePageLoadResult<{
  issuers: IssuerMaintenanceRecord[]
}>

type IssuerMaintenancePageLoaderData = MaintenancePageLoaderData<{
  issuers: IssuerMaintenanceRecord[]
}>

type IssuerMaintenanceReadDependencies = {
  getIssuerMaintenanceRecords: () => Promise<IssuerMaintenanceRecord[]>
}

async function getDefaultIssuerReadDependencies(): Promise<IssuerMaintenanceReadDependencies> {
  const { getIssuerMaintenanceRecords } = await import("@workspace/db")

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

type IssuerMaintenanceRouteComponentProps = {
  loaderData: IssuerMaintenancePageLoaderData
}

export function IssuerMaintenanceRouteComponent({
  loaderData,
}: IssuerMaintenanceRouteComponentProps) {
  return renderIssuerMaintenancePage(loaderData)
}

export function renderIssuerMaintenancePage(
  loaderData: IssuerMaintenancePageLoaderData
) {
  return renderMaintenancePage(loaderData, ({ issuers }) => (
    <main className="mt-8">
      <IssuersTable issuers={issuers} />
    </main>
  ))
}
