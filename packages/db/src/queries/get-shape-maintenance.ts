import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { shape } from "../schema/shape"
import type { Shape } from "../schema/shape"

export type ShapeMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetShapeMaintenanceRecordsOptions = {
  q?: string
  cursor?: ShapeMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}
export type ShapeMaintenanceListRecord = Shape & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: shape.id,
  code: shape.code,
  name: shape.name,
  version: shape.version,
  createdAt: shape.createdAt,
  updatedAt: shape.updatedAt,
}

export async function getShapeMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetShapeMaintenanceRecordsOptions = {}
): Promise<ShapeMaintenanceListRecord[]> {
  const sortColumn = options.sort === "code" ? shape.code : shape.name
  const secondarySortColumn = options.sort === "code" ? shape.name : shape.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(ilike(shape.code, `%${search}%`), ilike(shape.name, `%${search}%`))
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
            compare(shape.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(shape)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(shape.id)
    )
    .limit(options.limit ?? 30)
}

export async function getShapeMaintenanceRecordWithDatabase(
  database: typeof db,
  shapeId: string
): Promise<Shape | null> {
  const records = await database
    .select(selection)
    .from(shape)
    .where(eq(shape.id, shapeId))
    .limit(1)
  return records.at(0) ?? null
}
