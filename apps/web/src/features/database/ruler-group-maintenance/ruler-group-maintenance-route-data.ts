import { createServerFn } from "@tanstack/react-start"
import type { RulerGroupOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createRulerGroupAuthorizationError,
  hasRulerGroupMaintenanceAccess,
} from "./actions"

type LoadRulerGroupMaintenancePageDataResult = MaintenancePageLoadResult<
  {
    rulerGroups: RulerGroupOption[]
  },
  ReturnType<typeof createRulerGroupAuthorizationError>
>

export type RulerGroupMaintenancePageLoaderData = MaintenancePageLoaderData<{
  rulerGroups: RulerGroupOption[]
}>

type RulerGroupReadDependencies = {
  getRulerGroups: () => Promise<RulerGroupOption[]>
}

async function getDefaultRulerGroupReadDependencies(): Promise<RulerGroupReadDependencies> {
  const { getRulerGroups } = await import("@coin-archive/db")

  return {
    getRulerGroups,
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

  return toMaintenancePageLoaderData(result)
})

export function loadRulerGroupMaintenanceRouteData() {
  return getRulerGroupMaintenanceLoaderData()
}
