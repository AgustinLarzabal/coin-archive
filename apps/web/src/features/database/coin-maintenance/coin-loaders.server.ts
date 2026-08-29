import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"
import type { CollectorWithRole } from "@/lib/collector-role"

import { hasCoinMaintenanceAccess } from "./actions"
import { loadCoinFormOptions } from "./editor/coin-form.shared"
import type { CoinFormOptionsDependencies } from "./editor/coin-form.shared"
import type {
  EditCoinPageData,
  EditCoinReadDependencies,
} from "./editor/coin-edit-route-data"
import type { CreateCoinPageData } from "./editor/coin-create-route-data"
import type { MaintenancePageLoadResult } from "../maintenance-page"
import {
  COIN_MAINTENANCE_PAGE_SIZE,
  mapLoaderDepsToSearch,
} from "./listing/coin-maintenance-route-data"
import type {
  CoinMaintenanceLoaderDeps,
  CoinMaintenancePageData,
  CoinMaintenanceReadDependencies,
  CoinMaintenanceWebListItem,
  CoinMaintenanceWebListResult,
} from "./listing/coin-maintenance-route-data"
export async function getCoinFormOptionsDependencies() {
  const client = await getMaintenanceApiClient()
  return {
    getCoinMaintenanceOptions: async () =>
      (await client.coins.options({})).data,
  }
}

export async function getCoinCreateDependencies() {
  return getCoinFormOptionsDependencies()
}

export async function getCoinMaintenanceReadDependencies() {
  const client = await getMaintenanceApiClient()
  return {
    listCoins: client.coins.list,
    getOptions: () => client.coins.options({}),
  }
}

export async function getCoinEditDependencies() {
  const [client, formOptionsDependencies] = await Promise.all([
    getMaintenanceApiClient(),
    getCoinFormOptionsDependencies(),
  ])
  return {
    getCoinMaintenanceDeleteSummary: async (coinId: string) => {
      try {
        return (await client.coins.deleteSummary({ uuid: coinId })).data
      } catch (error) {
        if (isCoinNotFoundProblem(error)) return null
        throw error
      }
    },
    getCoinMaintenanceRecord: async (coinId: string) => {
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

export async function loadCoinCreatePageData(
  collector: CollectorWithRole | null,
  dependencies: CoinFormOptionsDependencies
): Promise<MaintenancePageLoadResult<CreateCoinPageData>> {
  if (!hasCoinMaintenanceAccess(collector)) return { status: "error" }

  return {
    status: "success",
    options: await loadCoinFormOptions(dependencies),
  }
}

export async function loadCoinEditPageData(
  collector: CollectorWithRole | null,
  loaderDeps: { coinId: string },
  dependencies: EditCoinReadDependencies
): Promise<MaintenancePageLoadResult<EditCoinPageData>> {
  if (!hasCoinMaintenanceAccess(collector)) return { status: "error" }

  const [coin, deleteSummary, options] = await Promise.all([
    dependencies.getCoinMaintenanceRecord(loaderDeps.coinId),
    dependencies.getCoinMaintenanceDeleteSummary(loaderDeps.coinId),
    loadCoinFormOptions(dependencies),
  ])

  return { status: "success", coin, deleteSummary, options }
}

export async function loadCoinMaintenancePageData(
  collector: CollectorWithRole | null,
  loaderDeps: CoinMaintenanceLoaderDeps,
  dependencies: CoinMaintenanceReadDependencies
): Promise<MaintenancePageLoadResult<CoinMaintenancePageData>> {
  if (!hasCoinMaintenanceAccess(collector)) return { status: "error" }

  const [items, options] = await Promise.all([
    loadAllCoinMaintenanceItems(dependencies.listCoins, {
      q: loaderDeps.titleQuery,
      issuer: loaderDeps.issuerCode,
      ruler: loaderDeps.rulerCode,
      distribution: loaderDeps.distributionCode,
      currency: loaderDeps.currencyCode,
      composition: loaderDeps.compositionCode,
    }),
    dependencies.getOptions(),
  ])
  const page = loaderDeps.page ?? 1
  const totalItems = items.length
  const totalPages = Math.ceil(totalItems / COIN_MAINTENANCE_PAGE_SIZE)
  const pageStart = (page - 1) * COIN_MAINTENANCE_PAGE_SIZE
  const list: CoinMaintenanceWebListResult = {
    items: items.slice(pageStart, pageStart + COIN_MAINTENANCE_PAGE_SIZE),
    page,
    pageSize: COIN_MAINTENANCE_PAGE_SIZE,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalItems > 0,
  }
  const { issuers, rulers, distributions, currencies, compositions } =
    options.data

  return {
    status: "success",
    search: mapLoaderDepsToSearch(loaderDeps),
    list,
    filterOptions: { issuers, rulers, distributions, currencies, compositions },
  }
}

async function loadAllCoinMaintenanceItems(
  listCoins: CoinMaintenanceReadDependencies["listCoins"],
  filters: Record<string, string | undefined>
): Promise<CoinMaintenanceWebListItem[]> {
  const items: CoinMaintenanceWebListItem[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined
  do {
    const result = await listCoins({
      ...filters,
      ...(cursor === undefined ? {} : { cursor }),
      limit: 100,
      sort: "updatedAt",
      order: "desc",
    })
    items.push(
      ...result.data.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }))
    )
    cursor = result.nextCursor ?? undefined
    if (cursor !== undefined && seenCursors.has(cursor)) {
      throw new Error("Coin Maintenance API repeated a cursor.")
    }
    if (cursor !== undefined) seenCursors.add(cursor)
  } while (cursor !== undefined)
  return items
}

function isCoinNotFoundProblem(error: unknown) {
  if (typeof error !== "object" || error === null) return false
  if ("code" in error && error.code === "NOT_FOUND") return true
  if (
    !("data" in error) ||
    typeof error.data !== "object" ||
    error.data === null
  )
    return false
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
