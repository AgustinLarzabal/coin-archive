import { createServerFn } from "@tanstack/react-start"
import type { EdgeOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createEdgeAuthorizationError,
  hasEdgeMaintenanceAccess,
} from "./actions"

type LoadResult = MaintenancePageLoadResult<
  {
    edges: EdgeOption[]
  },
  ReturnType<typeof createEdgeAuthorizationError>
>

export type EdgeMaintenancePageLoaderData = MaintenancePageLoaderData<{
  edges: EdgeOption[]
}>

type ReadDependencies = {
  getEdges: () => Promise<EdgeOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getEdges } = await import("@coin-archive/db")

  return {
    getEdges,
  }
}

export async function loadEdgeMaintenanceEdges(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasEdgeMaintenanceAccess(collector)) {
    return createEdgeAuthorizationError()
  }

  const { getEdges } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    edges: await getEdges(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadEdgeMaintenanceEdges(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadEdgeMaintenanceRouteData() {
  return getLoaderData()
}
