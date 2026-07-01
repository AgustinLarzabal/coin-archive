import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { RulerGroupOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { RulerGroupsTable } from "@/components/tables/ruler-groups/ruler-groups-table"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import {
  createRulerGroupAuthorizationError,
  hasRulerGroupMaintenanceAccess,
} from "@/lib/ruler-group-maintenance"
import type { RulerGroupAuthorizationErrorResult } from "@/lib/ruler-group-maintenance"

type LoadRulerGroupMaintenanceResult =
  | RulerGroupAuthorizationErrorResult
  | {
      status: "success"
      rulerGroups: RulerGroupOption[]
    }

type RulerGroupMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      rulerGroups: RulerGroupOption[]
    }

type RulerGroupReadDependencies = {
  getRulerGroups: () => Promise<RulerGroupOption[]>
}

async function getDefaultRulerGroupReadDependencies(): Promise<RulerGroupReadDependencies> {
  const { getRulerGroups } = await import("@workspace/db")

  return {
    getRulerGroups,
  }
}

async function resolveRulerGroupReadDependencies(
  dependencies?: RulerGroupReadDependencies
): Promise<RulerGroupReadDependencies> {
  return dependencies ?? getDefaultRulerGroupReadDependencies()
}

export async function loadRulerGroupMaintenanceRulerGroups(
  collector: CollectorWithRole | null,
  dependencies?: RulerGroupReadDependencies
): Promise<LoadRulerGroupMaintenanceResult> {
  if (!hasRulerGroupMaintenanceAccess(collector)) {
    return createRulerGroupAuthorizationError()
  }

  const { getRulerGroups } =
    await resolveRulerGroupReadDependencies(dependencies)

  return {
    status: "success",
    rulerGroups: await getRulerGroups(),
  }
}

const getRulerGroupMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadRulerGroupMaintenanceRulerGroups(
    session?.user ?? null
  )

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies RulerGroupMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    rulerGroups: result.rulerGroups,
  } satisfies RulerGroupMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/ruler-groups")({
  loader: () => getRulerGroupMaintenanceLoaderData(),
  component: DatabaseRulerGroupsComponent,
})

function DatabaseRulerGroupsComponent() {
  return renderDatabaseRulerGroupsPage(Route.useLoaderData())
}

export function renderDatabaseRulerGroupsPage(
  loaderData: RulerGroupMaintenanceLoaderData
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
      <RulerGroupsTable rulerGroups={loaderData.rulerGroups} />
    </main>
  )
}
