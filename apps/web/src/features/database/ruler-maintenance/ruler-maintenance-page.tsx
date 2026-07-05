import { createServerFn } from "@tanstack/react-start"
import type { RulerGroupOption, RulerOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createRulerAuthorizationError, hasRulerMaintenanceAccess } from "./actions"
import { RulersTable } from "./rulers-table"

type LoadRulerMaintenancePageDataResult =
  | ReturnType<typeof createRulerAuthorizationError>
  | {
      status: "success"
      rulers: RulerOption[]
      rulerGroups: RulerGroupOption[]
    }

type RulerMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      rulers: RulerOption[]
      rulerGroups: RulerGroupOption[]
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

function toRulerMaintenanceLoaderData(
  result: LoadRulerMaintenancePageDataResult
): RulerMaintenanceLoaderData {
  if (result.status === "error") {
    return { isAllowed: false }
  }

  return {
    isAllowed: true,
    rulers: result.rulers,
    rulerGroups: result.rulerGroups,
  }
}

export async function loadRulerMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: RulerReadDependencies
): Promise<LoadRulerMaintenancePageDataResult> {
  if (!hasRulerMaintenanceAccess(collector)) {
    return createRulerAuthorizationError()
  }

  const { getRulerGroups, getRulers } =
    dependencies ?? (await getDefaultRulerReadDependencies())

  const [rulers, rulerGroups] = await Promise.all([
    getRulers(),
    getRulerGroups(),
  ])

  return {
    status: "success",
    rulers,
    rulerGroups,
  }
}

const getRulerMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadRulerMaintenancePageData(session?.user ?? null)

  return toRulerMaintenanceLoaderData(result)
})

export function loadRulerMaintenanceRouteData() {
  return getRulerMaintenanceLoaderData()
}

type RulerMaintenanceRouteComponentProps = {
  loaderData: RulerMaintenanceLoaderData
}

export function RulerMaintenanceRouteComponent({
  loaderData,
}: RulerMaintenanceRouteComponentProps) {
  return renderRulerMaintenancePage(loaderData)
}

export function renderRulerMaintenancePage(
  loaderData: RulerMaintenanceLoaderData
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
      <RulersTable
        rulers={loaderData.rulers}
        rulerGroups={loaderData.rulerGroups}
      />
    </main>
  )
}
