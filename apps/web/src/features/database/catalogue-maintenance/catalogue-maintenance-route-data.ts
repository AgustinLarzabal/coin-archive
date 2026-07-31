import { createServerFn } from "@tanstack/react-start"
import type { CatalogueOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createCatalogueAuthorizationError,
  hasCatalogueMaintenanceAccess,
} from "./actions"

type LoadCatalogueMaintenancePageDataResult = MaintenancePageLoadResult<
  {
    catalogues: CatalogueOption[]
  },
  ReturnType<typeof createCatalogueAuthorizationError>
>

export type CatalogueMaintenancePageLoaderData = MaintenancePageLoaderData<{
  catalogues: CatalogueOption[]
}>

type CatalogueReadDependencies = {
  getCatalogues: () => Promise<CatalogueOption[]>
}

async function getDefaultCatalogueReadDependencies(): Promise<CatalogueReadDependencies> {
  const { getCatalogues } = await import("@coin-archive/db")

  return {
    getCatalogues,
  }
}

export async function loadCatalogueMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: CatalogueReadDependencies
): Promise<LoadCatalogueMaintenancePageDataResult> {
  if (!hasCatalogueMaintenanceAccess(collector)) {
    return createCatalogueAuthorizationError()
  }

  const { getCatalogues } =
    dependencies ?? (await getDefaultCatalogueReadDependencies())

  return {
    status: "success",
    catalogues: await getCatalogues(),
  }
}

const getCatalogueMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadCatalogueMaintenancePageData(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadCatalogueMaintenanceRouteData() {
  return getCatalogueMaintenanceLoaderData()
}
