import { createServerFn } from "@tanstack/react-start"
import type { CoinMaintenanceDeleteSummary } from "@coin-archive/api"
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
  EditableCoinRecord,
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

async function getDefaultDependencies(): Promise<EditCoinReadDependencies> {
  const [{ getMaintenanceApiClient }, formOptionsDependencies] =
    await Promise.all([
      import("@/lib/maintenance-api.server"),
      getCoinFormOptionsDependencies(),
    ])
  const client = await getMaintenanceApiClient()

  return {
    getCoinMaintenanceDeleteSummary: async (coinId) => {
      try {
        return (await client.coins.deleteSummary({ uuid: coinId })).data
      } catch (error) {
        if (isCoinNotFoundProblem(error)) return null
        throw error
      }
    },
    getCoinMaintenanceRecord: async (coinId) => {
      try {
        return (await client.coins.detail({ uuid: coinId })).data
      } catch (error) {
        if (isCoinNotFoundProblem(error)) return null
        throw error
      }
    },
    ...formOptionsDependencies,
  }
}

function isCoinNotFoundProblem(error: unknown) {
  if (typeof error !== "object" || error === null) return false
  if ("code" in error && error.code === "NOT_FOUND") return true
  if (
    !("data" in error) ||
    typeof error.data !== "object" ||
    error.data === null
  ) {
    return false
  }
  const data = error.data
  if ("code" in data && data.code === "coin_not_found") return true
  return (
    "body" in data &&
    typeof data.body === "object" &&
    data.body !== null &&
    "code" in data.body &&
    data.body.code === "coin_not_found"
  )
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
