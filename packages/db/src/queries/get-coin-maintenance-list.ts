import { and, asc, count, desc, eq, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"

import { db } from "../client"
import { coin } from "../schema/coin"
import { coinRuler } from "../schema/coin-ruler"
import { composition } from "../schema/composition"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"
import { issuer } from "../schema/issuer"
import { ruler } from "../schema/ruler"

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 50

export type CoinMaintenanceListOptions = {
  compositionCode?: string
  currencyCode?: string
  distributionCode?: string
  issuerCode?: string
  page?: number
  pageSize?: number
  rulerCode?: string
  titleQuery?: string
}

export type CoinMaintenanceListRecord = {
  id: string
  title: string
  issuer: {
    code: string
    name: string
  }
  minYear: number | null
  maxYear: number | null
  faceValue: {
    text: string
    currency: {
      code: string
      name: string
    }
  }
  distribution: {
    code: string
    name: string
  }
  composition: {
    code: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
}

export type CoinMaintenanceListResult = {
  items: CoinMaintenanceListRecord[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

type NormalizedCoinMaintenanceListOptions = {
  compositionCode?: string
  currencyCode?: string
  distributionCode?: string
  issuerCode?: string
  page: number
  pageSize: number
  rulerCode?: string
  titleQuery?: string
}

function normalizePage(page: number | undefined): number {
  if (typeof page !== "number" || !Number.isFinite(page)) {
    return DEFAULT_PAGE
  }

  return Math.max(DEFAULT_PAGE, Math.trunc(page))
}

function normalizePageSize(pageSize: number | undefined): number {
  if (typeof pageSize !== "number" || !Number.isFinite(pageSize)) {
    return DEFAULT_PAGE_SIZE
  }

  return Math.max(1, Math.trunc(pageSize))
}

function normalizeCodeFilter(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase()

  return normalized ? normalized : undefined
}

function normalizeTitleQuery(titleQuery: string | undefined): string | undefined {
  const normalized = titleQuery?.trim().toLowerCase()

  return normalized ? normalized : undefined
}

function buildTitleFilter(titleQuery: string | undefined): SQL | undefined {
  const normalizedTitleQuery = normalizeTitleQuery(titleQuery)

  if (!normalizedTitleQuery) {
    return undefined
  }

  return sql`lower(${coin.title}) like ${`%${normalizedTitleQuery}%`}`
}

function buildRulerFilter(rulerCode: string | undefined): SQL | undefined {
  const normalizedRulerCode = normalizeCodeFilter(rulerCode)

  if (!normalizedRulerCode) {
    return undefined
  }

  return sql`
    exists (
      select 1
      from ${coinRuler}
      inner join ${ruler}
        on ${ruler.id} = ${coinRuler.rulerId}
      where ${coinRuler.coinId} = ${coin.id}
        and lower(${ruler.code}) = ${normalizedRulerCode}
    )
  `
}

function buildCoinMaintenanceFilters(options: CoinMaintenanceListOptions): SQL[] {
  return [
    buildTitleFilter(options.titleQuery),
    buildIssuerFilter(options.issuerCode),
    buildRulerFilter(options.rulerCode),
    buildDistributionFilter(options.distributionCode),
    buildCurrencyFilter(options.currencyCode),
    buildCompositionFilter(options.compositionCode),
  ].filter((filter): filter is SQL => filter !== undefined)
}

function buildIssuerFilter(issuerCode: string | undefined): SQL | undefined {
  const normalizedIssuerCode = normalizeCodeFilter(issuerCode)

  if (!normalizedIssuerCode) {
    return undefined
  }

  return sql`
    ${coin.issuerId} in (
      select ${issuer.id}
      from ${issuer}
      where lower(${issuer.code}) = ${normalizedIssuerCode}
    )
  `
}

function buildDistributionFilter(
  distributionCode: string | undefined
): SQL | undefined {
  const normalizedDistributionCode = normalizeCodeFilter(distributionCode)

  if (!normalizedDistributionCode) {
    return undefined
  }

  return sql`
    ${coin.distributionId} in (
      select ${distribution.id}
      from ${distribution}
      where lower(${distribution.code}) = ${normalizedDistributionCode}
    )
  `
}

function buildCurrencyFilter(currencyCode: string | undefined): SQL | undefined {
  const normalizedCurrencyCode = normalizeCodeFilter(currencyCode)

  if (!normalizedCurrencyCode) {
    return undefined
  }

  return sql`
    ${coin.currencyId} in (
      select ${currency.id}
      from ${currency}
      where lower(${currency.code}) = ${normalizedCurrencyCode}
    )
  `
}

function buildCompositionFilter(
  compositionCode: string | undefined
): SQL | undefined {
  const normalizedCompositionCode = normalizeCodeFilter(compositionCode)

  if (!normalizedCompositionCode) {
    return undefined
  }

  return sql`
    ${coin.compositionId} in (
      select ${composition.id}
      from ${composition}
      where lower(${composition.code}) = ${normalizedCompositionCode}
    )
  `
}

function normalizeOptions(
  options: CoinMaintenanceListOptions
): NormalizedCoinMaintenanceListOptions {
  return {
    compositionCode: options.compositionCode,
    currencyCode: options.currencyCode,
    distributionCode: options.distributionCode,
    issuerCode: options.issuerCode,
    page: normalizePage(options.page),
    pageSize: normalizePageSize(options.pageSize),
    rulerCode: options.rulerCode,
    titleQuery: options.titleQuery,
  }
}

export function buildGetCoinMaintenanceListItemsQuery(
  database: typeof db,
  options: CoinMaintenanceListOptions = {}
) {
  const normalizedOptions = normalizeOptions(options)
  const offset = (normalizedOptions.page - 1) * normalizedOptions.pageSize
  const filters = buildCoinMaintenanceFilters(normalizedOptions)
  const whereClause = filters.length > 0 ? and(...filters) : undefined

  return database
    .select({
      id: coin.id,
      title: coin.title,
      issuerCode: issuer.code,
      issuerName: issuer.name,
      minYear: coin.minYear,
      maxYear: coin.maxYear,
      faceValueText: coin.faceValueText,
      currencyCode: currency.code,
      currencyName: currency.name,
      distributionCode: distribution.code,
      distributionName: distribution.name,
      compositionCode: composition.code,
      compositionName: composition.name,
      createdAt: coin.createdAt,
      updatedAt: coin.updatedAt,
    })
    .from(coin)
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .innerJoin(distribution, eq(coin.distributionId, distribution.id))
    .innerJoin(currency, eq(coin.currencyId, currency.id))
    .innerJoin(composition, eq(coin.compositionId, composition.id))
    .where(whereClause)
    .orderBy(desc(coin.updatedAt), desc(coin.id), asc(coin.title))
    .limit(normalizedOptions.pageSize)
    .offset(offset)
}

export async function getCoinMaintenanceList(
  options: CoinMaintenanceListOptions = {}
): Promise<CoinMaintenanceListResult> {
  const normalizedOptions = normalizeOptions(options)
  const filters = buildCoinMaintenanceFilters(normalizedOptions)
  const whereClause = filters.length > 0 ? and(...filters) : undefined

  const [countRow] = await db
    .select({ count: count() })
    .from(coin)
    .where(whereClause)

  const totalItems = countRow?.count ?? 0
  const totalPages =
    totalItems === 0 ? 0 : Math.ceil(totalItems / normalizedOptions.pageSize)

  const items = await buildGetCoinMaintenanceListItemsQuery(db, normalizedOptions)

  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      issuer: {
        code: item.issuerCode,
        name: item.issuerName,
      },
      minYear: item.minYear,
      maxYear: item.maxYear,
      faceValue: {
        text: item.faceValueText,
        currency: {
          code: item.currencyCode,
          name: item.currencyName,
        },
      },
      distribution: {
        code: item.distributionCode,
        name: item.distributionName,
      },
      composition: {
        code: item.compositionCode,
        name: item.compositionName,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    page: normalizedOptions.page,
    pageSize: normalizedOptions.pageSize,
    totalItems,
    totalPages,
    hasNextPage: normalizedOptions.page < totalPages,
    hasPreviousPage: normalizedOptions.page > 1 && totalItems > 0,
  }
}
