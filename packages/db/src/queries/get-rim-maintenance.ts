import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { rim } from "../schema/rim"
import type { Rim } from "../schema/rim"

export type RimMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetRimMaintenanceRecordsOptions = {
  q?: string
  cursor?: RimMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}
export type RimMaintenanceListRecord = Rim & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: rim.id,
  code: rim.code,
  name: rim.name,
  version: rim.version,
  createdAt: rim.createdAt,
  updatedAt: rim.updatedAt,
}

export async function getRimMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetRimMaintenanceRecordsOptions = {}
): Promise<RimMaintenanceListRecord[]> {
  const sortColumn = options.sort === "code" ? rim.code : rim.name
  const secondarySortColumn = options.sort === "code" ? rim.name : rim.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(ilike(rim.code, `%${search}%`), ilike(rim.name, `%${search}%`))
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
            compare(rim.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(rim)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(rim.id)
    )
    .limit(options.limit ?? 30)
}

export async function getRimMaintenanceRecordWithDatabase(
  database: typeof db,
  rimId: string
): Promise<Rim | null> {
  const records = await database
    .select(selection)
    .from(rim)
    .where(eq(rim.id, rimId))
    .limit(1)
  return records.at(0) ?? null
}
