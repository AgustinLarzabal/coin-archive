import { createServerFn } from "@tanstack/react-start"
import type { ShapeOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createShapeAuthorizationError,
  hasShapeMaintenanceAccess,
} from "./actions"

type LoadResult = MaintenancePageLoadResult<
  {
    shapes: ShapeOption[]
  },
  ReturnType<typeof createShapeAuthorizationError>
>

export type ShapeMaintenancePageLoaderData = MaintenancePageLoaderData<{
  shapes: ShapeOption[]
}>

type ReadDependencies = {
  getShapes: () => Promise<ShapeOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getShapes } = await import("@coin-archive/db")

  return {
    getShapes,
  }
}

export async function loadShapeMaintenanceShapes(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasShapeMaintenanceAccess(collector)) {
    return createShapeAuthorizationError()
  }

  const { getShapes } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    shapes: await getShapes(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadShapeMaintenanceShapes(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadShapeMaintenanceRouteData() {
  return getLoaderData()
}
