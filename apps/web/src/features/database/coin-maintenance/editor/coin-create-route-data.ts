import { createServerFn } from "@tanstack/react-start"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { loadCoinFormOptions } from "./coin-form.shared"
import type {
  CoinFormOptionsDependencies,
  CoinFormOptions,
} from "./coin-form.shared"
import { toMaintenancePageLoaderData } from "../../maintenance-page"
import type {
  MaintenancePageLoadResult,
  MaintenancePageLoaderData,
} from "../../maintenance-page"
import { hasCoinMaintenanceAccess } from "../actions"
import { getCoinCreateDependencies } from "../coin-loaders.server"

type CreateCoinPageData = {
  options: CoinFormOptions
}

export type CreateCoinLoaderData = MaintenancePageLoaderData<CreateCoinPageData>

export async function loadCoinCreatePageData(
  collector: CollectorWithRole | null,
  dependencies?: CoinFormOptionsDependencies
): Promise<MaintenancePageLoadResult<CreateCoinPageData>> {
  if (!hasCoinMaintenanceAccess(collector)) {
    return {
      status: "error",
    }
  }

  if (!dependencies) {
    throw new Error("Coin create loading must run through its server function.")
  }

  return {
    status: "success",
    options: await loadCoinFormOptions(dependencies),
  }
}

const getCoinCreateLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadCoinCreatePageData(
    session?.user ?? null,
    await getCoinCreateDependencies()
  )

  return toMaintenancePageLoaderData(result)
})

export function loadCoinCreateRouteData() {
  return getCoinCreateLoaderData()
}
