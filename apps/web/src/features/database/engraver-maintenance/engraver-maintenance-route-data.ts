import { createServerFn } from "@tanstack/react-start"
import type { EngraverOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createEngraverAuthorizationError,
  hasEngraverMaintenanceAccess,
} from "./actions"

type LoadEngraverMaintenancePageDataResult = MaintenancePageLoadResult<
  {
    engravers: EngraverOption[]
  },
  ReturnType<typeof createEngraverAuthorizationError>
>

export type EngraverMaintenancePageLoaderData = MaintenancePageLoaderData<{
  engravers: EngraverOption[]
}>

type EngraverReadDependencies = {
  getEngravers: () => Promise<EngraverOption[]>
}

async function getDefaultEngraverReadDependencies(): Promise<EngraverReadDependencies> {
  const { getEngravers } = await import("@coin-archive/db")

  return {
    getEngravers,
  }
}

export async function loadEngraverMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: EngraverReadDependencies
): Promise<LoadEngraverMaintenancePageDataResult> {
  if (!hasEngraverMaintenanceAccess(collector)) {
    return createEngraverAuthorizationError()
  }

  const { getEngravers } =
    dependencies ?? (await getDefaultEngraverReadDependencies())

  return {
    status: "success",
    engravers: await getEngravers(),
  }
}

const getEngraverMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadEngraverMaintenancePageData(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadEngraverMaintenanceRouteData() {
  return getEngraverMaintenanceLoaderData()
}
