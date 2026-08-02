import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { currency } from "../schema/currency"
import type { Currency } from "../schema/currency"

export type CurrencyMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetCurrencyMaintenanceRecordsOptions = {
  q?: string
  cursor?: CurrencyMaintenanceCursor
  limit?: number
  sort?: "code" | "fullName" | "name"
  order?: "asc" | "desc"
}
export type CurrencyMaintenanceListRecord = Currency & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: currency.id,
  code: currency.code,
  name: currency.name,
  fullName: currency.fullName,
  version: currency.version,
  createdAt: currency.createdAt,
  updatedAt: currency.updatedAt,
}

export async function getCurrencyMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetCurrencyMaintenanceRecordsOptions = {}
): Promise<CurrencyMaintenanceListRecord[]> {
  const sortColumn =
    options.sort === "code"
      ? currency.code
      : options.sort === "fullName"
        ? currency.fullName
        : currency.name
  const secondarySortColumn =
    options.sort === "code" ? currency.name : currency.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(
        ilike(currency.code, `%${search}%`),
        ilike(currency.name, `%${search}%`),
        ilike(currency.fullName, `%${search}%`)
      )
    : undefined
  const cursor = options.cursor
  const cursorFilter =
    cursor === undefined
      ? undefined
      : or(
          compare(normalizedSortColumn, cursor.value),
          and(
            eq(normalizedSortColumn, cursor.value),
            compare(normalizedSecondarySortColumn, cursor.secondaryValue)
          ),
          and(
            eq(normalizedSortColumn, cursor.value),
            eq(normalizedSecondarySortColumn, cursor.secondaryValue),
            compare(currency.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(currency)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(currency.id)
    )
    .limit(options.limit ?? 30)
}

export async function getCurrencyMaintenanceRecordWithDatabase(
  database: typeof db,
  currencyId: string
): Promise<Currency | null> {
  const records = await database
    .select(selection)
    .from(currency)
    .where(eq(currency.id, currencyId))
    .limit(1)
  return records.at(0) ?? null
}
