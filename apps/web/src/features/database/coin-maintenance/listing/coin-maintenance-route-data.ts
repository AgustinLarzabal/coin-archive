import { createServerFn } from "@tanstack/react-start"
import type {
  CompositionOption,
  CurrencyOption,
  DistributionOption,
} from "@coin-archive/api"
import type {
  CoinMaintenanceListOptions,
  CoinMaintenanceListResult,
  IssuerOption,
  RulerOption,
} from "@coin-archive/db"
import { z } from "zod"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { loadAllMaintenanceOptions } from "@/lib/maintenance-options.server"

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
  list: CoinMaintenanceListResult
  filterOptions: CoinMaintenanceFilterOptions
}

type CoinMaintenanceReadDependencies = {
  getCoinMaintenanceList: (
    options?: CoinMaintenanceListOptions
  ) => Promise<CoinMaintenanceListResult>
  getIssuers: () => Promise<IssuerOption[]>
  getRulers: () => Promise<RulerOption[]>
  getDistributions: () => Promise<DistributionOption[]>
  getCurrencies: () => Promise<CurrencyOption[]>
  getCompositions: () => Promise<CompositionOption[]>
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
  const [
    { getCoinMaintenanceList, getIssuers, getRulers },
    { getMaintenanceApiClient },
  ] = await Promise.all([
    import("@coin-archive/db"),
    import("@/lib/maintenance-api.server"),
  ])
  const maintenanceClient = await getMaintenanceApiClient()

  return {
    getCoinMaintenanceList,
    getIssuers,
    getRulers,
    getDistributions: () =>
      loadAllMaintenanceOptions(maintenanceClient.distributions.options),
    getCurrencies: () =>
      loadAllMaintenanceOptions(maintenanceClient.currencies.options),
    getCompositions: () =>
      loadAllMaintenanceOptions(maintenanceClient.compositions.options),
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

  const [list, issuers, rulers, distributions, currencies, compositions] =
    await Promise.all([
      resolvedDependencies.getCoinMaintenanceList({
        ...loaderDeps,
        page: loaderDeps.page ?? 1,
        pageSize: COIN_MAINTENANCE_PAGE_SIZE,
      }),
      resolvedDependencies.getIssuers(),
      resolvedDependencies.getRulers(),
      resolvedDependencies.getDistributions(),
      resolvedDependencies.getCurrencies(),
      resolvedDependencies.getCompositions(),
    ])

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
