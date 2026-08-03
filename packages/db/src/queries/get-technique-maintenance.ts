import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { technique } from "../schema/technique"
import type { Technique } from "../schema/technique"

export type TechniqueMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetTechniqueMaintenanceRecordsOptions = {
  q?: string
  cursor?: TechniqueMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}
export type TechniqueMaintenanceListRecord = Technique & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: technique.id,
  code: technique.code,
  name: technique.name,
  version: technique.version,
  createdAt: technique.createdAt,
  updatedAt: technique.updatedAt,
}

export async function getTechniqueMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetTechniqueMaintenanceRecordsOptions = {}
): Promise<TechniqueMaintenanceListRecord[]> {
  const sortColumn = options.sort === "code" ? technique.code : technique.name
  const secondarySortColumn =
    options.sort === "code" ? technique.name : technique.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(
        ilike(technique.code, `%${search}%`),
        ilike(technique.name, `%${search}%`)
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
            compare(technique.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(technique)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(technique.id)
    )
    .limit(options.limit ?? 30)
}

export async function getTechniqueMaintenanceRecordWithDatabase(
  database: typeof db,
  techniqueId: string
): Promise<Technique | null> {
  const records = await database
    .select(selection)
    .from(technique)
    .where(eq(technique.id, techniqueId))
    .limit(1)
  return records.at(0) ?? null
}
