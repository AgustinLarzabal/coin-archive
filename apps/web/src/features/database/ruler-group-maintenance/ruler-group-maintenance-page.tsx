import { createServerFn } from "@tanstack/react-start"
import type { RulerGroupOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  createRulerGroupAuthorizationError,
  hasRulerGroupMaintenanceAccess,
  type RulerGroupAuthorizationErrorResult,
} from "./actions"
import { RulerGroupsTable } from "./ruler-groups-table"

type LoadRulerGroupMaintenancePageDataResult =
  | RulerGroupAuthorizationErrorResult
  | {
      status: "success"
      rulerGroups: RulerGroupOption[]
    }

type RulerGroupMaintenancePageLoaderData =
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

function toRulerGroupMaintenanceLoaderData(
  result: LoadRulerGroupMaintenancePageDataResult
): RulerGroupMaintenancePageLoaderData {
  if (result.status === "error") {
    return { isAllowed: false }
  }

  return {
    isAllowed: true,
    rulerGroups: result.rulerGroups,
  }
}

export async function loadRulerGroupMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: RulerGroupReadDependencies
): Promise<LoadRulerGroupMaintenancePageDataResult> {
  if (!hasRulerGroupMaintenanceAccess(collector)) {
    return createRulerGroupAuthorizationError()
  }

  const { getRulerGroups } =
    dependencies ?? (await getDefaultRulerGroupReadDependencies())

  return {
    status: "success",
    rulerGroups: await getRulerGroups(),
  }
}

const getRulerGroupMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadRulerGroupMaintenancePageData(session?.user ?? null)

  return toRulerGroupMaintenanceLoaderData(result)
})

export function loadRulerGroupMaintenanceRouteData() {
  return getRulerGroupMaintenanceLoaderData()
}

type RulerGroupMaintenanceRouteComponentProps = {
  loaderData: RulerGroupMaintenancePageLoaderData
}

export function RulerGroupMaintenanceRouteComponent({
  loaderData,
}: RulerGroupMaintenanceRouteComponentProps) {
  return renderRulerGroupMaintenancePage(loaderData)
}

export function renderRulerGroupMaintenancePage(
  loaderData: RulerGroupMaintenancePageLoaderData
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
