import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { IssuersTable } from "@/components/tables/issuers/issuers-table"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

type LoadIssuerMaintenanceIssuersResult =
  | {
      status: "error"
    }
  | {
      status: "success"
      issuers: IssuerMaintenanceRecord[]
    }

type IssuerMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      issuers: IssuerMaintenanceRecord[]
    }

type IssuerReadDependencies = {
  getIssuerMaintenanceRecords: () => Promise<IssuerMaintenanceRecord[]>
}

async function getDefaultIssuerReadDependencies(): Promise<IssuerReadDependencies> {
  const { getIssuerMaintenanceRecords } = await import("@workspace/db")

  return {
    getIssuerMaintenanceRecords,
  }
}

async function resolveIssuerReadDependencies(
  dependencies?: IssuerReadDependencies
): Promise<IssuerReadDependencies> {
  return dependencies ?? getDefaultIssuerReadDependencies()
}

export async function loadIssuerMaintenanceIssuers(
  collector: CollectorWithRole | null,
  dependencies?: IssuerReadDependencies
): Promise<LoadIssuerMaintenanceIssuersResult> {
  if (!getEditorRouteAuthorization(collector).isAllowed) {
    return {
      status: "error",
    }
  }

  const { getIssuerMaintenanceRecords } =
    await resolveIssuerReadDependencies(dependencies)

  return {
    status: "success",
    issuers: await getIssuerMaintenanceRecords(),
  }
}

const getIssuerMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadIssuerMaintenanceIssuers(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies IssuerMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    issuers: result.issuers,
  } satisfies IssuerMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/issuers")({
  loader: () => getIssuerMaintenanceLoaderData(),
  component: DatabaseIssuersComponent,
})

function DatabaseIssuersComponent() {
  return renderDatabaseIssuersPage(Route.useLoaderData())
}

export function renderDatabaseIssuersPage(
  loaderData: IssuerMaintenanceLoaderData
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
