import { createServerFn } from "@tanstack/react-start"

import { getAuthSession } from "@/lib/auth-session"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import {
  getCoinCreateDependencies,
  getCoinEditDependencies,
  getCoinMaintenanceReadDependencies,
  loadCoinCreatePageData,
  loadCoinEditPageData,
  loadCoinMaintenancePageData,
} from "./coin-loaders.server"
import {
  coinEditLoaderDepsSchema,
  getCoinEditLoaderDeps,
} from "./editor/coin-edit-route-data"
import { coinMaintenanceLoaderDepsSchema } from "./listing/coin-maintenance-route-data"
import type { CoinMaintenanceLoaderDeps } from "./listing/coin-maintenance-route-data"

const getCoinMaintenanceLoaderData = createServerFn({ method: "GET" })
  .inputValidator(coinMaintenanceLoaderDepsSchema)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    return toMaintenancePageLoaderData(
      await loadCoinMaintenancePageData(
        session?.user ?? null,
        data,
        await getCoinMaintenanceReadDependencies()
      )
    )
  })

const getCoinCreateLoaderData = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getAuthSession()
    return toMaintenancePageLoaderData(
      await loadCoinCreatePageData(
        session?.user ?? null,
        await getCoinCreateDependencies()
      )
    )
  }
)

const getCoinEditLoaderData = createServerFn({ method: "GET" })
  .inputValidator(coinEditLoaderDepsSchema)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    return toMaintenancePageLoaderData(
      await loadCoinEditPageData(
        session?.user ?? null,
        getCoinEditLoaderDeps(data),
        await getCoinEditDependencies()
      )
    )
  })

export function loadCoinMaintenanceRouteData({
  deps,
}: {
  deps: CoinMaintenanceLoaderDeps
}) {
  return getCoinMaintenanceLoaderData({ data: deps })
}

export function loadCoinCreateRouteData() {
  return getCoinCreateLoaderData()
}

export function loadCoinEditRouteData({
  params,
}: {
  params: { coinId: string }
}) {
  return getCoinEditLoaderData({ data: params })
}
