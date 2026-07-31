import { createServerFn } from "@tanstack/react-start"
import type {
  CoinMaintenanceDeleteSummary,
  CoinMaintenanceRecord,
} from "@coin-archive/db"
import { z } from "zod"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  getCoinFormOptionsDependencies,
  loadCoinFormOptions,
} from "./coin-form.shared"
import type {
  CoinFormOptions,
  CoinFormOptionsDependencies,
} from "./coin-form.shared"
import { toMaintenancePageLoaderData } from "../../maintenance-page"
import type {
  MaintenancePageLoadResult,
  MaintenancePageLoaderData,
} from "../../maintenance-page"
import { hasCoinMaintenanceAccess } from "../actions"

const coinEditLoaderDepsSchema = z.object({
  coinId: z.uuid(),
})

type EditCoinPageData = {
  coin: CoinMaintenanceRecord | null
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
  ) => Promise<CoinMaintenanceRecord | null>
}

async function getDefaultDependencies(): Promise<EditCoinReadDependencies> {
  const [
    { getCoinMaintenanceDeleteSummary, getCoinMaintenanceRecord },
    formOptionsDependencies,
  ] = await Promise.all([
    import("@coin-archive/db"),
    getCoinFormOptionsDependencies(),
  ])

  return {
    getCoinMaintenanceDeleteSummary,
    getCoinMaintenanceRecord,
    ...formOptionsDependencies,
  }
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

  const resolvedDependencies = dependencies ?? (await getDefaultDependencies())

  const [coin, deleteSummary, options] = await Promise.all([
    resolvedDependencies.getCoinMaintenanceRecord(loaderDeps.coinId),
    resolvedDependencies.getCoinMaintenanceDeleteSummary(loaderDeps.coinId),
    loadCoinFormOptions(resolvedDependencies),
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
    const result = await loadCoinEditPageData(session?.user ?? null, data)

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
