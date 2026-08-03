import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { theme } from "../schema/theme"
import type { Theme } from "../schema/theme"

export type ThemeMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetThemeMaintenanceRecordsOptions = {
  q?: string
  cursor?: ThemeMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}
export type ThemeMaintenanceListRecord = Theme & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: theme.id,
  code: theme.code,
  name: theme.name,
  version: theme.version,
  createdAt: theme.createdAt,
  updatedAt: theme.updatedAt,
}

export async function getThemeMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetThemeMaintenanceRecordsOptions = {}
): Promise<ThemeMaintenanceListRecord[]> {
  const sortColumn = options.sort === "code" ? theme.code : theme.name
  const secondarySortColumn = options.sort === "code" ? theme.name : theme.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(ilike(theme.code, `%${search}%`), ilike(theme.name, `%${search}%`))
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
            compare(theme.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(theme)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(theme.id)
    )
    .limit(options.limit ?? 30)
}

export async function getThemeMaintenanceRecordWithDatabase(
  database: typeof db,
  themeId: string
): Promise<Theme | null> {
  const records = await database
    .select(selection)
    .from(theme)
    .where(eq(theme.id, themeId))
    .limit(1)
  return records.at(0) ?? null
}
