import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { rulerGroup } from "../schema/ruler-group"
import type { RulerGroup } from "../schema/ruler-group"

export type RulerGroupMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetRulerGroupMaintenanceRecordsOptions = {
  q?: string
  cursor?: RulerGroupMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}
export type RulerGroupMaintenanceListRecord = RulerGroup & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: rulerGroup.id,
  code: rulerGroup.code,
  name: rulerGroup.name,
  version: rulerGroup.version,
  createdAt: rulerGroup.createdAt,
  updatedAt: rulerGroup.updatedAt,
}

export async function getRulerGroupMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetRulerGroupMaintenanceRecordsOptions = {}
): Promise<RulerGroupMaintenanceListRecord[]> {
  const sortColumn = options.sort === "code" ? rulerGroup.code : rulerGroup.name
  const secondarySortColumn = options.sort === "code" ? rulerGroup.name : rulerGroup.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(ilike(rulerGroup.code, `%${search}%`), ilike(rulerGroup.name, `%${search}%`))
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
            compare(rulerGroup.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(rulerGroup)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(rulerGroup.id)
    )
    .limit(options.limit ?? 30)
}

export async function getRulerGroupMaintenanceRecordWithDatabase(
  database: typeof db,
  rulerGroupId: string
): Promise<RulerGroup | null> {
  const records = await database
    .select(selection)
    .from(rulerGroup)
    .where(eq(rulerGroup.id, rulerGroupId))
    .limit(1)
  return records.at(0) ?? null
}
