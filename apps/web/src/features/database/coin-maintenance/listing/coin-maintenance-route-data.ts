import { createServerFn } from "@tanstack/react-start"
import type {
  CoinMaintenanceOptionsOutput,
  CompositionOption,
  CurrencyOption,
  DistributionOption,
  IssuerOption,
  MaintenanceApiClient,
  RulerOption,
} from "@coin-archive/api"
import { z } from "zod"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../../maintenance-page"
import type {
  MaintenancePageLoadResult,
  MaintenancePageLoaderData,
} from "../../maintenance-page"

export const COIN_MAINTENANCE_PAGE_SIZE = 50

const optionalStringSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined
  }

  const normalizedValue = value.trim().toLowerCase()

  return normalizedValue === "" ? undefined : normalizedValue
}, z.string().optional())

const optionalPositiveIntegerSchema = z.preprocess((value) => {
  if (typeof value === "number") {
    return value
  }

  if (typeof value !== "string") {
    return undefined
  }

  const normalizedValue = value.trim()

  if (normalizedValue === "") {
    return undefined
  }

  return Number.parseInt(normalizedValue, 10)
}, z.number().int().min(1).optional())

export const coinMaintenanceSearchSchema = z.object({
  title: optionalStringSchema,
  issuer: optionalStringSchema,
  ruler: optionalStringSchema,
  distribution: optionalStringSchema,
  currency: optionalStringSchema,
  composition: optionalStringSchema,
  page: optionalPositiveIntegerSchema,
})

const coinMaintenanceLoaderDepsSchema = z.object({
  titleQuery: optionalStringSchema,
  issuerCode: optionalStringSchema,
  rulerCode: optionalStringSchema,
  distributionCode: optionalStringSchema,
  currencyCode: optionalStringSchema,
  compositionCode: optionalStringSchema,
  page: optionalPositiveIntegerSchema,
})

export type CoinMaintenanceSearch = z.infer<typeof coinMaintenanceSearchSchema>
export type CoinMaintenanceLoaderDeps = z.infer<
  typeof coinMaintenanceLoaderDepsSchema
>

type CoinMaintenanceFilterOptions = {
  issuers: IssuerOption[]
  rulers: RulerOption[]
  distributions: DistributionOption[]
  currencies: CurrencyOption[]
  compositions: CompositionOption[]
}

type CoinMaintenancePageData = {
  search: CoinMaintenanceSearch
  list: CoinMaintenanceWebListResult
  filterOptions: CoinMaintenanceFilterOptions
}

type CoinMaintenanceReadDependencies = {
  listCoins: MaintenanceApiClient["coins"]["list"]
  getOptions: () => Promise<CoinMaintenanceOptionsOutput>
}

type CoinMaintenanceWebListItem = {
  id: string
  title: string
  issuer: { code: string; name: string }
  minYear: number | null
  maxYear: number | null
  faceValue: { text: string; currency: { code: string; name: string } }
  distribution: { code: string; name: string }
  composition: { code: string; name: string }
  createdAt: Date
  updatedAt: Date
}

export type CoinMaintenanceWebListResult = {
  items: CoinMaintenanceWebListItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

type LoadCoinMaintenancePageDataResult =
  MaintenancePageLoadResult<CoinMaintenancePageData>

export type CoinMaintenancePageLoaderData =
  MaintenancePageLoaderData<CoinMaintenancePageData>

const COIN_MAINTENANCE_FILTER_KEYS = [
  ["title", "titleQuery"],
  ["issuer", "issuerCode"],
  ["ruler", "rulerCode"],
  ["distribution", "distributionCode"],
  ["currency", "currencyCode"],
  ["composition", "compositionCode"],
] as const

async function getDefaultCoinMaintenanceReadDependencies(): Promise<CoinMaintenanceReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const maintenanceClient = await getMaintenanceApiClient()

  return {
    listCoins: maintenanceClient.coins.list,
    getOptions: () => maintenanceClient.coins.options({}),
  }
}

function hasCoinMaintenanceAccess(
  collector: CollectorWithRole | null
): collector is CollectorWithRole {
  return collector?.role === "editor" || collector?.role === "admin"
}

export function getCoinMaintenanceLoaderDeps(
  search: CoinMaintenanceSearch
): CoinMaintenanceLoaderDeps {
  const loaderDeps = {
    page: search.page ?? 1,
  } as CoinMaintenanceLoaderDeps

  for (const [searchKey, loaderKey] of COIN_MAINTENANCE_FILTER_KEYS) {
    loaderDeps[loaderKey] = search[searchKey]
  }

  return loaderDeps
}

function mapLoaderDepsToSearch(
  loaderDeps: CoinMaintenanceLoaderDeps
): CoinMaintenanceSearch {
  const search = {
    page: loaderDeps.page ?? 1,
  } as CoinMaintenanceSearch

  for (const [searchKey, loaderKey] of COIN_MAINTENANCE_FILTER_KEYS) {
    const value = loaderDeps[loaderKey]

    if (value !== undefined) {
      search[searchKey] = value
    }
  }

  return search
}

export async function loadCoinMaintenancePageData(
  collector: CollectorWithRole | null,
  loaderDeps: CoinMaintenanceLoaderDeps,
  dependencies?: CoinMaintenanceReadDependencies
): Promise<LoadCoinMaintenancePageDataResult> {
  if (!hasCoinMaintenanceAccess(collector)) {
    return {
      status: "error",
    }
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCoinMaintenanceReadDependencies())

  const input = {
    q: loaderDeps.titleQuery,
    issuer: loaderDeps.issuerCode,
    ruler: loaderDeps.rulerCode,
    distribution: loaderDeps.distributionCode,
    currency: loaderDeps.currencyCode,
    composition: loaderDeps.compositionCode,
  }
  const [items, options] = await Promise.all([
    loadAllCoinMaintenanceItems(resolvedDependencies.listCoins, input),
    resolvedDependencies.getOptions(),
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
    filterOptions: {
      issuers,
      rulers,
      distributions,
      currencies,
      compositions,
    },
  }
}

async function loadAllCoinMaintenanceItems(
  listCoins: MaintenanceApiClient["coins"]["list"],
  filters: {
    q?: string
    issuer?: string
    ruler?: string
    distribution?: string
    currency?: string
    composition?: string
  }
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

const getCoinMaintenanceLoaderData = createServerFn({
  method: "GET",
})
  .inputValidator(coinMaintenanceLoaderDepsSchema)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const result = await loadCoinMaintenancePageData(
      session?.user ?? null,
      data
    )

    return toMaintenancePageLoaderData(result)
  })

export function loadCoinMaintenanceRouteData({
  deps,
}: {
  deps: CoinMaintenanceLoaderDeps
}) {
  return getCoinMaintenanceLoaderData({ data: deps })
}
