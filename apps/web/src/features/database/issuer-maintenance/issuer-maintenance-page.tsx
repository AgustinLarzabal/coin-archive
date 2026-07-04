import { createServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

import { IssuersTable } from "./table-workflow/issuers-table"

type LoadIssuerMaintenancePageDataResult =
  | {
      status: "error"
    }
  | {
      status: "success"
      issuers: IssuerMaintenanceRecord[]
    }

type IssuerMaintenancePageLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      issuers: IssuerMaintenanceRecord[]
    }

type IssuerMaintenanceReadDependencies = {
  getIssuerMaintenanceRecords: () => Promise<IssuerMaintenanceRecord[]>
}

async function getDefaultIssuerReadDependencies(): Promise<IssuerMaintenanceReadDependencies> {
  const { getIssuerMaintenanceRecords } = await import("@workspace/db")

  return {
    getIssuerMaintenanceRecords,
  }
}

function toIssuerMaintenancePageLoaderData(
  result: LoadIssuerMaintenancePageDataResult
): IssuerMaintenancePageLoaderData {
  if (result.status === "error") {
    return {
      isAllowed: false,
    }
  }

  return {
    isAllowed: true,
    issuers: result.issuers,
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

  return toIssuerMaintenancePageLoaderData(result)
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
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <IssuersTable issuers={loaderData.issuers} />
    </main>
  )
}
