import { createServerFn } from "@tanstack/react-start"
import type { MintOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createMintAuthorizationError,
  hasMintMaintenanceAccess,
} from "./actions"

type LoadMintMaintenancePageDataResult = MaintenancePageLoadResult<
  {
    mints: MintOption[]
  },
  ReturnType<typeof createMintAuthorizationError>
>

export type MintMaintenancePageLoaderData = MaintenancePageLoaderData<{
  mints: MintOption[]
}>

type MintReadDependencies = {
  getMints: () => Promise<MintOption[]>
}

async function getDefaultMintReadDependencies(): Promise<MintReadDependencies> {
  const { getMints } = await import("@coin-archive/db")

  return {
    getMints,
  }
}

export async function loadMintMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: MintReadDependencies
): Promise<LoadMintMaintenancePageDataResult> {
  if (!hasMintMaintenanceAccess(collector)) {
    return createMintAuthorizationError()
  }

  const { getMints } = dependencies ?? (await getDefaultMintReadDependencies())

  return {
    status: "success",
    mints: await getMints(),
  }
}

const getMintMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadMintMaintenancePageData(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadMintMaintenanceRouteData() {
  return getMintMaintenanceLoaderData()
}
