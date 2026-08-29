import { createServerFn } from "@tanstack/react-start"
import type { CoinMaintenanceDeleteSummary } from "@coin-archive/api"
import { z } from "zod"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { loadCoinFormOptions } from "./coin-form.shared"
import type {
  CoinFormOptions,
  CoinFormOptionsDependencies,
  EditableCoinRecord,
} from "./coin-form.shared"
import { toMaintenancePageLoaderData } from "../../maintenance-page"
import type {
  MaintenancePageLoadResult,
  MaintenancePageLoaderData,
} from "../../maintenance-page"
import { hasCoinMaintenanceAccess } from "../actions"
import { getCoinEditDependencies } from "../coin-loaders.server"

const coinEditLoaderDepsSchema = z.object({
  coinId: z.uuid(),
})

type EditCoinPageData = {
  coin: EditableCoinRecord | null
  deleteSummary: CoinMaintenanceDeleteSummary | null
  options: CoinFormOptions
}

export type EditCoinLoaderData = MaintenancePageLoaderData<EditCoinPageData>

type CoinEditLoaderDeps = z.infer<typeof coinEditLoaderDepsSchema>

type EditCoinReadDependencies = CoinFormOptionsDependencies & {
  getCoinMaintenanceDeleteSummary: (
    coinId: string
  ) => Promise<CoinMaintenanceDeleteSummary | null>
  getCoinMaintenanceRecord: (
    coinId: string
  ) => Promise<EditableCoinRecord | null>
}

export async function loadCoinEditPageData(
  collector: CollectorWithRole | null,
  loaderDeps: CoinEditLoaderDeps,
  dependencies?: EditCoinReadDependencies
): Promise<MaintenancePageLoadResult<EditCoinPageData>> {
  if (!hasCoinMaintenanceAccess(collector)) {
    return {
      status: "error",
    }
  }

  if (!dependencies) {
    throw new Error("Coin edit loading must run through its server function.")
  }

  const [coin, deleteSummary, options] = await Promise.all([
    dependencies.getCoinMaintenanceRecord(loaderDeps.coinId),
    dependencies.getCoinMaintenanceDeleteSummary(loaderDeps.coinId),
    loadCoinFormOptions(dependencies),
  ])

  return {
    status: "success",
    coin,
    deleteSummary,
    options,
  }
}

const getCoinEditLoaderData = createServerFn({
  method: "GET",
})
  .inputValidator(coinEditLoaderDepsSchema)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const result = await loadCoinEditPageData(
      session?.user ?? null,
      data,
      await getCoinEditDependencies()
    )

    return toMaintenancePageLoaderData(result)
  })

export function getCoinEditLoaderDeps(params: {
  coinId: string
}): CoinEditLoaderDeps {
  return {
    coinId: params.coinId,
  }
}

export function loadCoinEditRouteData({
  params,
}: {
  params: { coinId: string }
}) {
  return getCoinEditLoaderData({ data: getCoinEditLoaderDeps(params) })
}
