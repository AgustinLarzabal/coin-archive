import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"

import type { db } from "../client"
import { orientation } from "../schema/orientation"
import type { Orientation } from "../schema/orientation"

export type OrientationMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}

export type GetOrientationMaintenanceRecordsOptions = {
  q?: string
  cursor?: OrientationMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}

export type OrientationMaintenanceListRecord = Orientation & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: orientation.id,
  code: orientation.code,
  name: orientation.name,
  version: orientation.version,
  createdAt: orientation.createdAt,
  updatedAt: orientation.updatedAt,
}

export async function getOrientationMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetOrientationMaintenanceRecordsOptions = {}
): Promise<OrientationMaintenanceListRecord[]> {
  const sortColumn =
    options.sort === "code" ? orientation.code : orientation.name
  const secondarySortColumn =
    options.sort === "code" ? orientation.name : orientation.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const cursorComparison = options.order === "desc" ? lt : gt
  const normalizedSearch = options.q?.trim()
  const searchFilter = normalizedSearch
    ? or(
        ilike(orientation.code, `%${normalizedSearch}%`),
        ilike(orientation.name, `%${normalizedSearch}%`)
      )
    : undefined
  const cursorFilter = buildCursorFilter(
    normalizedSortColumn,
    normalizedSecondarySortColumn,
    options.cursor,
    cursorComparison
  )

  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(orientation)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(orientation.id)
    )
    .limit(options.limit ?? 30)
}

export async function getOrientationMaintenanceRecordWithDatabase(
  database: typeof db,
  orientationId: string
): Promise<Orientation | null> {
  const records = await database
    .select(selection)
    .from(orientation)
    .where(eq(orientation.id, orientationId))
    .limit(1)

  return records.at(0) ?? null
}

function buildCursorFilter(
  sortColumn: SQL<string>,
  secondarySortColumn: SQL<string>,
  cursor: OrientationMaintenanceCursor | undefined,
  compare: typeof gt | typeof lt
) {
  if (cursor === undefined) return undefined

  return or(
    compare(sortColumn, cursor.value),
    and(
      eq(sortColumn, cursor.value),
      compare(secondarySortColumn, cursor.secondaryValue)
    ),
    and(
      eq(sortColumn, cursor.value),
      eq(secondarySortColumn, cursor.secondaryValue),
      compare(orientation.id, cursor.id)
    )
  )
}
