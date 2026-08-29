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

export type CoinMaintenanceSearch = z.infer<typeof coinMaintenanceSearchSchema>
export const coinMaintenanceLoaderDepsSchema = z.object({
  titleQuery: optionalStringSchema,
  issuerCode: optionalStringSchema,
  rulerCode: optionalStringSchema,
  distributionCode: optionalStringSchema,
  currencyCode: optionalStringSchema,
  compositionCode: optionalStringSchema,
  page: optionalPositiveIntegerSchema,
})
export type CoinMaintenanceLoaderDeps = z.infer<
  typeof coinMaintenanceLoaderDepsSchema
>

export type CoinMaintenanceFilterOptions = {
  issuers: IssuerOption[]
  rulers: RulerOption[]
  distributions: DistributionOption[]
  currencies: CurrencyOption[]
  compositions: CompositionOption[]
}

export type CoinMaintenancePageData = {
  search: CoinMaintenanceSearch
  list: CoinMaintenanceWebListResult
  filterOptions: CoinMaintenanceFilterOptions
}

export type CoinMaintenanceReadDependencies = {
  listCoins: MaintenanceApiClient["coins"]["list"]
  getOptions: () => Promise<CoinMaintenanceOptionsOutput>
}

export type CoinMaintenanceWebListItem = {
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

export type LoadCoinMaintenancePageDataResult =
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

export function mapLoaderDepsToSearch(
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
