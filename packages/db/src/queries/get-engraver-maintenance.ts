import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { engraver } from "../schema/engraver"
import type { Engraver } from "../schema/engraver"

export type EngraverMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetEngraverMaintenanceRecordsOptions = {
  q?: string
  cursor?: EngraverMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}
export type EngraverMaintenanceListRecord = Engraver & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: engraver.id,
  code: engraver.code,
  name: engraver.name,
  version: engraver.version,
  createdAt: engraver.createdAt,
  updatedAt: engraver.updatedAt,
}

export async function getEngraverMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetEngraverMaintenanceRecordsOptions = {}
): Promise<EngraverMaintenanceListRecord[]> {
  const sortColumn = options.sort === "code" ? engraver.code : engraver.name
  const secondarySortColumn = options.sort === "code" ? engraver.name : engraver.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(ilike(engraver.code, `%${search}%`), ilike(engraver.name, `%${search}%`))
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
            compare(engraver.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(engraver)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(engraver.id)
    )
    .limit(options.limit ?? 30)
}

export async function getEngraverMaintenanceRecordWithDatabase(
  database: typeof db,
  engraverId: string
): Promise<Engraver | null> {
  const records = await database
    .select(selection)
    .from(engraver)
    .where(eq(engraver.id, engraverId))
    .limit(1)
  return records.at(0) ?? null
}
