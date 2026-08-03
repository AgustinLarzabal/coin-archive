import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"

import type { db } from "../client"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import type { Ruler } from "../schema/ruler"

export type RulerMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}

export type GetRulerMaintenanceRecordsOptions = {
  q?: string
  cursor?: RulerMaintenanceCursor
  limit?: number
  sort?: "code" | "name"
  order?: "asc" | "desc"
}

export type RulerMaintenanceRecord = Ruler & {
  group: { id: string; code: string; name: string } | null
}

export type RulerMaintenanceListRecord = RulerMaintenanceRecord & {
  cursorValue: string
  cursorSecondaryValue: string
}

const selection = {
  id: ruler.id,
  code: ruler.code,
  name: ruler.name,
  rulerGroupId: ruler.rulerGroupId,
  version: ruler.version,
  createdAt: ruler.createdAt,
  updatedAt: ruler.updatedAt,
  groupId: rulerGroup.id,
  groupCode: rulerGroup.code,
  groupName: rulerGroup.name,
}

type RulerMaintenanceRow = {
  id: string
  code: string
  name: string
  rulerGroupId: string | null
  version: number
  createdAt: Date
  updatedAt: Date
  groupId: string | null
  groupCode: string | null
  groupName: string | null
}

function mapRecord(row: RulerMaintenanceRow): RulerMaintenanceRecord {
  const { groupId, groupCode, groupName, ...record } = row
  return {
    ...record,
    group:
      groupId === null || groupCode === null || groupName === null
        ? null
        : { id: groupId, code: groupCode, name: groupName },
  }
}

export async function getRulerMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetRulerMaintenanceRecordsOptions = {}
): Promise<RulerMaintenanceListRecord[]> {
  const sortColumn = options.sort === "code" ? ruler.code : ruler.name
  const secondarySortColumn = options.sort === "code" ? ruler.name : ruler.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(ilike(ruler.code, `%${search}%`), ilike(ruler.name, `%${search}%`))
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
            compare(ruler.id, cursor.id)
          )
        )

  const rows = await database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(ruler)
    .leftJoin(rulerGroup, eq(ruler.rulerGroupId, rulerGroup.id))
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(ruler.id)
    )
    .limit(options.limit ?? 30)

  return rows.map(({ cursorValue, cursorSecondaryValue, ...row }) => ({
    ...mapRecord(row),
    cursorValue,
    cursorSecondaryValue,
  }))
}

export async function getRulerMaintenanceRecordWithDatabase(
  database: typeof db,
  rulerId: string
): Promise<RulerMaintenanceRecord | null> {
  const row = (
    await database
      .select(selection)
      .from(ruler)
      .leftJoin(rulerGroup, eq(ruler.rulerGroupId, rulerGroup.id))
      .where(eq(ruler.id, rulerId))
      .limit(1)
  ).at(0)

  return row === undefined ? null : mapRecord(row)
}
