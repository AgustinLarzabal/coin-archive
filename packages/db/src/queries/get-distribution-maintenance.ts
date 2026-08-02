import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { distribution } from "../schema/distribution"
import type { Distribution } from "../schema/distribution"

export type DistributionMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetDistributionMaintenanceRecordsOptions = {
  q?: string
  cursor?: DistributionMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}
export type DistributionMaintenanceListRecord = Distribution & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: distribution.id,
  code: distribution.code,
  name: distribution.name,
  version: distribution.version,
  createdAt: distribution.createdAt,
  updatedAt: distribution.updatedAt,
}

export async function getDistributionMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetDistributionMaintenanceRecordsOptions = {}
): Promise<DistributionMaintenanceListRecord[]> {
  const sortColumn =
    options.sort === "code" ? distribution.code : distribution.name
  const secondarySortColumn =
    options.sort === "code" ? distribution.name : distribution.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(
        ilike(distribution.code, `%${search}%`),
        ilike(distribution.name, `%${search}%`)
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
            compare(distribution.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(distribution)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(distribution.id)
    )
    .limit(options.limit ?? 30)
}

export async function getDistributionMaintenanceRecordWithDatabase(
  database: typeof db,
  distributionId: string
): Promise<Distribution | null> {
  const records = await database
    .select(selection)
    .from(distribution)
    .where(eq(distribution.id, distributionId))
    .limit(1)
  return records.at(0) ?? null
}
