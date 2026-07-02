import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { RulerGroupOption, RulerOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { RulersTable } from "@/components/tables/rulers/rulers-table"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import {
  createRulerAuthorizationError,
  hasRulerMaintenanceAccess,
} from "@/lib/ruler-maintenance"
import type { RulerAuthorizationErrorResult } from "@/lib/ruler-maintenance"

type LoadRulerMaintenanceResult =
  | RulerAuthorizationErrorResult
  | {
      status: "success"
      rulerGroups: RulerGroupOption[]
      rulers: RulerOption[]
    }

type RulerMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      rulerGroups: RulerGroupOption[]
      rulers: RulerOption[]
    }

type RulerReadDependencies = {
  getRulerGroups: () => Promise<RulerGroupOption[]>
  getRulers: () => Promise<RulerOption[]>
}

async function getDefaultRulerReadDependencies(): Promise<RulerReadDependencies> {
  const { getRulerGroups, getRulers } = await import("@workspace/db")

  return {
    getRulerGroups,
    getRulers,
  }
}

async function resolveRulerReadDependencies(
  dependencies?: RulerReadDependencies
): Promise<RulerReadDependencies> {
  return dependencies ?? getDefaultRulerReadDependencies()
}

export async function loadRulerMaintenanceData(
  collector: CollectorWithRole | null,
  dependencies?: RulerReadDependencies
): Promise<LoadRulerMaintenanceResult> {
  if (!hasRulerMaintenanceAccess(collector)) {
    return createRulerAuthorizationError()
  }

  const { getRulerGroups, getRulers } =
    await resolveRulerReadDependencies(dependencies)
  const [rulerGroups, rulers] = await Promise.all([
    getRulerGroups(),
    getRulers(),
  ])

  return {
    status: "success",
    rulerGroups,
    rulers,
  }
}

const getRulerMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadRulerMaintenanceData(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies RulerMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    rulerGroups: result.rulerGroups,
    rulers: result.rulers,
  } satisfies RulerMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/rulers")({
  loader: () => getRulerMaintenanceLoaderData(),
  component: DatabaseRulersComponent,
})

function DatabaseRulersComponent() {
  return renderDatabaseRulersPage(Route.useLoaderData())
}

export function renderDatabaseRulersPage(loaderData: RulerMaintenanceLoaderData) {
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <RulersTable
        rulers={loaderData.rulers}
        rulerGroups={loaderData.rulerGroups}
      />
    </main>
  )
}
