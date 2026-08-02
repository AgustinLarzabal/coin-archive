import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { edge } from "../schema/edge"
import type { Edge } from "../schema/edge"

export type EdgeMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetEdgeMaintenanceRecordsOptions = {
  q?: string
  cursor?: EdgeMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}
export type EdgeMaintenanceListRecord = Edge & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: edge.id,
  code: edge.code,
  name: edge.name,
  version: edge.version,
  createdAt: edge.createdAt,
  updatedAt: edge.updatedAt,
}

export async function getEdgeMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetEdgeMaintenanceRecordsOptions = {}
): Promise<EdgeMaintenanceListRecord[]> {
  const sortColumn = options.sort === "code" ? edge.code : edge.name
  const secondarySortColumn = options.sort === "code" ? edge.name : edge.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(ilike(edge.code, `%${search}%`), ilike(edge.name, `%${search}%`))
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
            compare(edge.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(edge)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(edge.id)
    )
    .limit(options.limit ?? 30)
}

export async function getEdgeMaintenanceRecordWithDatabase(
  database: typeof db,
  edgeId: string
): Promise<Edge | null> {
  const records = await database
    .select(selection)
    .from(edge)
    .where(eq(edge.id, edgeId))
    .limit(1)
  return records.at(0) ?? null
}
