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

type CoinMaintenanceQueryRow = {
  id: string
  title: string
  issuerCode: string
  issuerName: string
  minYear: number | null
  maxYear: number | null
  faceValueText: string
  currencyCode: string
  currencyName: string
  distributionCode: string
  distributionName: string
  compositionCode: string
  compositionName: string
  createdAt: Date
  updatedAt: Date
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

function buildTitleFilter(titleQuery: string | undefined): SQL | undefined {
  if (!titleQuery) {
    return undefined
  }

  return sql`lower(${coin.title}) like ${`%${titleQuery}%`}`
}

function buildRulerFilter(rulerCode: string | undefined): SQL | undefined {
  if (!rulerCode) {
    return undefined
  }

  return sql`
    exists (
      select 1
      from ${coinRuler}
      inner join ${ruler}
        on ${ruler.id} = ${coinRuler.rulerId}
      where ${coinRuler.coinId} = ${coin.id}
        and lower(${ruler.code}) = ${rulerCode}
    )
  `
}

function buildIssuerFilter(issuerCode: string | undefined): SQL | undefined {
  if (!issuerCode) {
    return undefined
  }

  return sql`
    ${coin.issuerId} in (
      select ${issuer.id}
      from ${issuer}
      where lower(${issuer.code}) = ${issuerCode}
    )
  `
}

function buildDistributionFilter(
  distributionCode: string | undefined
): SQL | undefined {
  if (!distributionCode) {
    return undefined
  }

  return sql`
    ${coin.distributionId} in (
      select ${distribution.id}
      from ${distribution}
      where lower(${distribution.code}) = ${distributionCode}
    )
  `
}

function buildCurrencyFilter(currencyCode: string | undefined): SQL | undefined {
  if (!currencyCode) {
    return undefined
  }

  return sql`
    ${coin.currencyId} in (
      select ${currency.id}
      from ${currency}
      where lower(${currency.code}) = ${currencyCode}
    )
  `
}

function buildCompositionFilter(
  compositionCode: string | undefined
): SQL | undefined {
  if (!compositionCode) {
    return undefined
  }

  return sql`
    ${coin.compositionId} in (
      select ${composition.id}
      from ${composition}
      where lower(${composition.code}) = ${compositionCode}
    )
  `
}

function buildCoinMaintenanceFilters(
  options: NormalizedCoinMaintenanceListOptions
): SQL[] {
  return [
    buildTitleFilter(options.titleQuery),
    buildIssuerFilter(options.issuerCode),
    buildRulerFilter(options.rulerCode),
    buildDistributionFilter(options.distributionCode),
    buildCurrencyFilter(options.currencyCode),
    buildCompositionFilter(options.compositionCode),
  ].filter((filter): filter is SQL => filter !== undefined)
}

function normalizeOptions(
  options: CoinMaintenanceListOptions
): NormalizedCoinMaintenanceListOptions {
  return {
    compositionCode: normalizeCodeFilter(options.compositionCode),
    currencyCode: normalizeCodeFilter(options.currencyCode),
    distributionCode: normalizeCodeFilter(options.distributionCode),
    issuerCode: normalizeCodeFilter(options.issuerCode),
    page: normalizePage(options.page),
    pageSize: normalizePageSize(options.pageSize),
    rulerCode: normalizeCodeFilter(options.rulerCode),
    titleQuery: normalizeCodeFilter(options.titleQuery),
  }
}

function buildWhereClause(options: NormalizedCoinMaintenanceListOptions) {
  const filters = buildCoinMaintenanceFilters(options)

  return filters.length > 0 ? and(...filters) : undefined
}

function mapCoinMaintenanceQueryRow(
  item: CoinMaintenanceQueryRow
): CoinMaintenanceListRecord {
  return {
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
  }
}

export function buildGetCoinMaintenanceListItemsQuery(
  database: typeof db,
  options: CoinMaintenanceListOptions = {}
) {
  const normalizedOptions = normalizeOptions(options)
  const offset = (normalizedOptions.page - 1) * normalizedOptions.pageSize
  const whereClause = buildWhereClause(normalizedOptions)

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
  const whereClause = buildWhereClause(normalizedOptions)

  const countRows = await db
    .select({ count: count() })
    .from(coin)
    .where(whereClause)

  const totalItems = countRows.at(0)?.count ?? 0
  const totalPages =
    totalItems === 0 ? 0 : Math.ceil(totalItems / normalizedOptions.pageSize)

  const items = await buildGetCoinMaintenanceListItemsQuery(db, normalizedOptions)

  return {
    items: items.map(mapCoinMaintenanceQueryRow),
    page: normalizedOptions.page,
    pageSize: normalizedOptions.pageSize,
    totalItems,
    totalPages,
    hasNextPage: normalizedOptions.page < totalPages,
    hasPreviousPage: normalizedOptions.page > 1 && totalItems > 0,
  }
}
