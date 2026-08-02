import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { composition } from "../schema/composition"
import type { Composition } from "../schema/composition"

export type CompositionMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetCompositionMaintenanceRecordsOptions = {
  q?: string
  cursor?: CompositionMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}
export type CompositionMaintenanceListRecord = Composition & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: composition.id,
  code: composition.code,
  name: composition.name,
  version: composition.version,
  createdAt: composition.createdAt,
  updatedAt: composition.updatedAt,
}

export async function getCompositionMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetCompositionMaintenanceRecordsOptions = {}
): Promise<CompositionMaintenanceListRecord[]> {
  const sortColumn =
    options.sort === "code" ? composition.code : composition.name
  const secondarySortColumn =
    options.sort === "code" ? composition.name : composition.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(
        ilike(composition.code, `%${search}%`),
        ilike(composition.name, `%${search}%`)
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
            compare(composition.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(composition)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(composition.id)
    )
    .limit(options.limit ?? 30)
}

export async function getCompositionMaintenanceRecordWithDatabase(
  database: typeof db,
  compositionId: string
): Promise<Composition | null> {
  const records = await database
    .select(selection)
    .from(composition)
    .where(eq(composition.id, compositionId))
    .limit(1)
  return records.at(0) ?? null
}
