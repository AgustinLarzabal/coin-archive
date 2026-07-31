import { createServerFn } from "@tanstack/react-start"
import type { DistributionOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createDistributionAuthorizationError,
  hasDistributionMaintenanceAccess,
} from "./actions"

type LoadResult = MaintenancePageLoadResult<
  {
    distributions: DistributionOption[]
  },
  ReturnType<typeof createDistributionAuthorizationError>
>

export type LoaderData = MaintenancePageLoaderData<{
  distributions: DistributionOption[]
}>

type ReadDependencies = {
  getDistributions: () => Promise<DistributionOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getDistributions } = await import("@coin-archive/db")

  return {
    getDistributions,
  }
}

export async function loadDistributionMaintenanceDistributions(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasDistributionMaintenanceAccess(collector)) {
    return createDistributionAuthorizationError()
  }

  const { getDistributions } =
    dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    distributions: await getDistributions(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadDistributionMaintenanceDistributions(
    session?.user ?? null
  )

  return toMaintenancePageLoaderData(result)
})

export function loadDistributionMaintenanceRouteData() {
  return getLoaderData()
}
