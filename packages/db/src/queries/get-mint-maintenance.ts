import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { mint } from "../schema/mint"
import type { Mint } from "../schema/mint"

export type MintMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetMintMaintenanceRecordsOptions = {
  q?: string
  cursor?: MintMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}
export type MintMaintenanceListRecord = Mint & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: mint.id,
  code: mint.code,
  name: mint.name,
  version: mint.version,
  createdAt: mint.createdAt,
  updatedAt: mint.updatedAt,
}

export async function getMintMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetMintMaintenanceRecordsOptions = {}
): Promise<MintMaintenanceListRecord[]> {
  const sortColumn = options.sort === "code" ? mint.code : mint.name
  const secondarySortColumn = options.sort === "code" ? mint.name : mint.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(ilike(mint.code, `%${search}%`), ilike(mint.name, `%${search}%`))
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
            compare(mint.id, cursor.id)
          )
        )
  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(mint)
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(mint.id)
    )
    .limit(options.limit ?? 30)
}

export async function getMintMaintenanceRecordWithDatabase(
  database: typeof db,
  mintId: string
): Promise<Mint | null> {
  const records = await database
    .select(selection)
    .from(mint)
    .where(eq(mint.id, mintId))
    .limit(1)
  return records.at(0) ?? null
}
