import { and, asc, count, desc, eq, gt, lt, or, sql } from "drizzle-orm"
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
    id: string
    code: string
    name: string
  }
  minYear: number | null
  maxYear: number | null
  faceValue: {
    text: string
    currency: {
      id: string
      code: string
      name: string
    }
  }
  distribution: {
    id: string
    code: string
    name: string
  }
  composition: {
    id: string
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
  issuerId: string
  issuerName: string
  minYear: number | null
  maxYear: number | null
  faceValueText: string
  currencyCode: string
  currencyId: string
  currencyName: string
  distributionCode: string
  distributionId: string
  distributionName: string
  compositionCode: string
  compositionId: string
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
      with recursive issuer_tree(id) as (
        select "issuer"."id"
        from "issuer"
        where lower("issuer"."code") = ${issuerCode}
        union
        select "child_issuer"."id"
        from "issuer" as "child_issuer"
        inner join issuer_tree
          on "child_issuer"."parent_issuer_id" = issuer_tree.id
      )
      select issuer_tree.id
      from issuer_tree
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

function buildCurrencyFilter(
  currencyCode: string | undefined
): SQL | undefined {
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
      id: item.issuerId,
      code: item.issuerCode,
      name: item.issuerName,
    },
    minYear: item.minYear,
    maxYear: item.maxYear,
    faceValue: {
      text: item.faceValueText,
      currency: {
        id: item.currencyId,
        code: item.currencyCode,
        name: item.currencyName,
      },
    },
    distribution: {
      id: item.distributionId,
      code: item.distributionCode,
      name: item.distributionName,
    },
    composition: {
      id: item.compositionId,
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
      issuerId: issuer.id,
      issuerName: issuer.name,
      minYear: coin.minYear,
      maxYear: coin.maxYear,
      faceValueText: coin.faceValueText,
      currencyCode: currency.code,
      currencyId: currency.id,
      currencyName: currency.name,
      distributionCode: distribution.code,
      distributionId: distribution.id,
      distributionName: distribution.name,
      compositionCode: composition.code,
      compositionId: composition.id,
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

export type CoinMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}

export type GetCoinMaintenanceRecordsOptions = Omit<
  CoinMaintenanceListOptions,
  "page" | "pageSize" | "titleQuery"
> & {
  q?: string
  cursor?: CoinMaintenanceCursor
  limit?: number
  sort?: "updatedAt" | "title"
  order?: "asc" | "desc"
}

export type CoinMaintenanceApiListRecord = CoinMaintenanceListRecord & {
  cursorValue: string
  cursorSecondaryValue: string
}

export async function getCoinMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetCoinMaintenanceRecordsOptions = {}
): Promise<CoinMaintenanceApiListRecord[]> {
  const normalizedOptions = normalizeOptions({
    ...options,
    titleQuery: options.q,
  })
  const direction = options.order === "asc" ? asc : desc
  const compare = options.order === "asc" ? gt : lt
  const titleValue = sql<string>`lower(${coin.title})`
  const cursor = options.cursor
  const cursorFilter =
    cursor === undefined
      ? undefined
      : options.sort === "title"
        ? or(
            compare(titleValue, cursor.value),
            and(
              eq(titleValue, cursor.value),
              compare(coin.updatedAt, new Date(cursor.secondaryValue))
            ),
            and(
              eq(titleValue, cursor.value),
              eq(coin.updatedAt, new Date(cursor.secondaryValue)),
              compare(coin.id, cursor.id)
            )
          )
        : or(
            compare(coin.updatedAt, new Date(cursor.value)),
            and(
              eq(coin.updatedAt, new Date(cursor.value)),
              compare(titleValue, cursor.secondaryValue)
            ),
            and(
              eq(coin.updatedAt, new Date(cursor.value)),
              eq(titleValue, cursor.secondaryValue),
              compare(coin.id, cursor.id)
            )
          )
  const filters = buildCoinMaintenanceFilters(normalizedOptions)
  if (cursorFilter !== undefined) filters.push(cursorFilter)
  const rows = await database
    .select({
      id: coin.id,
      title: coin.title,
      issuerId: issuer.id,
      issuerCode: issuer.code,
      issuerName: issuer.name,
      minYear: coin.minYear,
      maxYear: coin.maxYear,
      faceValueText: coin.faceValueText,
      currencyId: currency.id,
      currencyCode: currency.code,
      currencyName: currency.name,
      distributionId: distribution.id,
      distributionCode: distribution.code,
      distributionName: distribution.name,
      compositionId: composition.id,
      compositionCode: composition.code,
      compositionName: composition.name,
      createdAt: coin.createdAt,
      updatedAt: coin.updatedAt,
      cursorTitle: titleValue,
    })
    .from(coin)
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .innerJoin(distribution, eq(coin.distributionId, distribution.id))
    .innerJoin(currency, eq(coin.currencyId, currency.id))
    .innerJoin(composition, eq(coin.compositionId, composition.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(
      ...(options.sort === "title"
        ? [direction(titleValue), direction(coin.updatedAt), direction(coin.id)]
        : [
            direction(coin.updatedAt),
            direction(titleValue),
            direction(coin.id),
          ])
    )
    .limit(options.limit ?? 30)

  return rows.map((row) => ({
    ...mapCoinMaintenanceQueryRow(row),
    cursorValue:
      options.sort === "title" ? row.cursorTitle : row.updatedAt.toISOString(),
    cursorSecondaryValue:
      options.sort === "title" ? row.updatedAt.toISOString() : row.cursorTitle,
  }))
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

  const items = await buildGetCoinMaintenanceListItemsQuery(
    db,
    normalizedOptions
  )

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
