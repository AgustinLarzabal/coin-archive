import { createServerFn } from "@tanstack/react-start"
import type { OrientationOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createOrientationAuthorizationError,
  hasOrientationMaintenanceAccess,
} from "./actions"

type LoadResult = MaintenancePageLoadResult<
  {
    orientations: OrientationOption[]
  },
  ReturnType<typeof createOrientationAuthorizationError>
>

export type LoaderData = MaintenancePageLoaderData<{
  orientations: OrientationOption[]
}>

type ReadDependencies = {
  getOrientations: () => Promise<OrientationOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getOrientations } = await import("@coin-archive/db")

  return {
    getOrientations,
  }
}

export async function loadOrientationMaintenanceOrientations(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasOrientationMaintenanceAccess(collector)) {
    return createOrientationAuthorizationError()
  }

  const { getOrientations } =
    dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    orientations: await getOrientations(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadOrientationMaintenanceOrientations(
    session?.user ?? null
  )

  return toMaintenancePageLoaderData(result)
})

export function loadOrientationMaintenanceRouteData() {
  return getLoaderData()
}
