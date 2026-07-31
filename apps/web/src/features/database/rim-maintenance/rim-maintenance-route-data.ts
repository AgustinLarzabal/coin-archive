import { createServerFn } from "@tanstack/react-start"
import type { RimOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createRimAuthorizationError, hasRimMaintenanceAccess } from "./actions"

type LoadResult = MaintenancePageLoadResult<
  {
    rims: RimOption[]
  },
  ReturnType<typeof createRimAuthorizationError>
>

export type RimMaintenancePageLoaderData = MaintenancePageLoaderData<{
  rims: RimOption[]
}>

type ReadDependencies = {
  getRims: () => Promise<RimOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getRims } = await import("@coin-archive/db")

  return {
    getRims,
  }
}

export async function loadRimMaintenanceRims(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasRimMaintenanceAccess(collector)) {
    return createRimAuthorizationError()
  }

  const { getRims } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    rims: await getRims(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadRimMaintenanceRims(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadRimMaintenanceRouteData() {
  return getLoaderData()
}
