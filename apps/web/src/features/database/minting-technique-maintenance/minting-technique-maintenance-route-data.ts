import { createServerFn } from "@tanstack/react-start"
import type { TechniqueOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createMintingTechniqueAuthorizationError,
  hasMintingTechniqueMaintenanceAccess,
} from "./actions"

type LoadResult = MaintenancePageLoadResult<
  {
    mintingTechniques: TechniqueOption[]
  },
  ReturnType<typeof createMintingTechniqueAuthorizationError>
>

export type LoaderData = MaintenancePageLoaderData<{
  mintingTechniques: TechniqueOption[]
}>

type ReadDependencies = {
  getTechniques: () => Promise<TechniqueOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getTechniques } = await import("@coin-archive/db")

  return {
    getTechniques,
  }
}

export async function loadMintingTechniqueMaintenanceMintingTechniques(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasMintingTechniqueMaintenanceAccess(collector)) {
    return createMintingTechniqueAuthorizationError()
  }

  const { getTechniques } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    mintingTechniques: await getTechniques(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadMintingTechniqueMaintenanceMintingTechniques(
    session?.user ?? null
  )

  return toMaintenancePageLoaderData(result)
})

export function loadMintingTechniqueMaintenanceRouteData() {
  return getLoaderData()
}
