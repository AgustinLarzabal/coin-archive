import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { catalogue } from "../schema/catalogue"
import type { Catalogue } from "../schema/catalogue"

export type CatalogueMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}

export type GetCatalogueMaintenanceRecordsOptions = {
  q?: string
  cursor?: CatalogueMaintenanceCursor
  limit?: number
  sort?: "code" | "title"
  order?: "asc" | "desc"
}

export type CatalogueMaintenanceListRecord = Catalogue & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: catalogue.id,
  code: catalogue.code,
  title: catalogue.title,
  version: catalogue.version,
  createdAt: catalogue.createdAt,
  updatedAt: catalogue.updatedAt,
}

export async function getCatalogueMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetCatalogueMaintenanceRecordsOptions = {}
): Promise<CatalogueMaintenanceListRecord[]> {
  const sortColumn = options.sort === "code" ? catalogue.code : catalogue.title
  const secondarySortColumn =
    options.sort === "code" ? catalogue.title : catalogue.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(
        ilike(catalogue.code, `%${search}%`),
        ilike(catalogue.title, `%${search}%`)
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
            compare(catalogue.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(catalogue)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(catalogue.id)
    )
    .limit(options.limit ?? 30)
}

export async function getCatalogueMaintenanceRecordWithDatabase(
  database: typeof db,
  catalogueId: string
): Promise<Catalogue | null> {
  const records = await database
    .select(selection)
    .from(catalogue)
    .where(eq(catalogue.id, catalogueId))
    .limit(1)
  return records.at(0) ?? null
}
