import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { RimOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { RimsTable } from "@/components/tables/rims/rims-table"
import { getAuthSession } from "@/lib/auth-session"
import {
  type RimAuthorizationErrorResult,
  createRimAuthorizationError,
  hasRimMaintenanceAccess,
} from "@/lib/rim-maintenance"
import type { CollectorWithRole } from "@/lib/collector-role"

type LoadRimMaintenanceRimsResult =
  | RimAuthorizationErrorResult
  | {
      status: "success"
      rims: RimOption[]
    }

type RimMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      rims: RimOption[]
    }

type RimReadDependencies = {
  getRims: () => Promise<RimOption[]>
}

async function getDefaultRimReadDependencies(): Promise<RimReadDependencies> {
  const { getRims } = await import("@workspace/db")

  return {
    getRims,
  }
}

export async function loadRimMaintenanceRims(
  collector: CollectorWithRole | null,
  dependencies?: RimReadDependencies
): Promise<LoadRimMaintenanceRimsResult> {
  if (!hasRimMaintenanceAccess(collector)) {
    return createRimAuthorizationError()
  }

  const { getRims } = dependencies ?? (await getDefaultRimReadDependencies())

  return {
    status: "success",
    rims: await getRims(),
  }
}

const getRimMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadRimMaintenanceRims(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies RimMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    rims: result.rims,
  } satisfies RimMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/rims")({
  loader: () => getRimMaintenanceLoaderData(),
  component: DatabaseRimsComponent,
})

function DatabaseRimsComponent() {
  return renderDatabaseRimsPage(Route.useLoaderData())
}

export function renderDatabaseRimsPage(loaderData: RimMaintenanceLoaderData) {
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <RimsTable rims={loaderData.rims} />
    </main>
  )
}
