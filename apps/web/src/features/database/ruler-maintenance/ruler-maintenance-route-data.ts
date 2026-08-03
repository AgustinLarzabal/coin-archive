import { createServerFn } from "@tanstack/react-start"
import type { RulerGroupOption } from "@coin-archive/api"
import type { RulerOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { loadAllMaintenanceOptions } from "@/lib/maintenance-options.server"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createRulerAuthorizationError,
  hasRulerMaintenanceAccess,
} from "./actions"

type LoadRulerMaintenancePageDataResult = MaintenancePageLoadResult<
  {
    rulers: RulerOption[]
    rulerGroups: RulerGroupOption[]
  },
  ReturnType<typeof createRulerAuthorizationError>
>

export type RulerMaintenancePageLoaderData = MaintenancePageLoaderData<{
  rulers: RulerOption[]
  rulerGroups: RulerGroupOption[]
}>

type RulerReadDependencies = {
  getRulerGroups: () => Promise<RulerGroupOption[]>
  getRulers: () => Promise<RulerOption[]>
}

async function getDefaultRulerReadDependencies(): Promise<RulerReadDependencies> {
  const [{ getRulers }, { getMaintenanceApiClient }] = await Promise.all([
    import("@coin-archive/db"),
    import("@/lib/maintenance-api.server"),
  ])
  const maintenanceClient = await getMaintenanceApiClient()

  return {
    getRulerGroups: () =>
      loadAllMaintenanceOptions(maintenanceClient.rulerGroups.options),
    getRulers,
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

  return toMaintenancePageLoaderData(result)
})

export function loadRulerMaintenanceRouteData() {
  return getRulerMaintenanceLoaderData()
}
