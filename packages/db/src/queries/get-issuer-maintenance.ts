import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

import type { db } from "../client"
import { issuer } from "../schema/issuer"

export type IssuerMaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
export type GetIssuerMaintenanceRecordsOptions = {
  q?: string
  cursor?: IssuerMaintenanceCursor
  limit?: number
  sort?: "code" | "isoCode" | "name"
  order?: "asc" | "desc"
}

const parentIssuer = alias(issuer, "maintenance_parent_issuer")

const selection = {
  id: issuer.id,
  code: issuer.code,
  isoCode: issuer.isoCode,
  name: issuer.name,
  parentIssuerId: issuer.parentIssuerId,
  parent: {
    id: parentIssuer.id,
    code: parentIssuer.code,
    name: parentIssuer.name,
  },
  version: issuer.version,
  createdAt: issuer.createdAt,
  updatedAt: issuer.updatedAt,
}

export type IssuerMaintenanceListRecord = Awaited<
  ReturnType<typeof getIssuerMaintenanceRecordsWithDatabase>
>[number]

export async function getIssuerMaintenanceRecordsWithDatabase(
  database: typeof db,
  options: GetIssuerMaintenanceRecordsOptions = {}
) {
  const sortColumn =
    options.sort === "code"
      ? issuer.code
      : options.sort === "isoCode"
        ? issuer.isoCode
        : issuer.name
  const secondarySortColumn =
    options.sort === "code" || options.sort === "isoCode"
      ? issuer.name
      : issuer.code
  const normalizedSortColumn = sql<string>`lower(${sortColumn})`
  const normalizedSecondarySortColumn = sql<string>`lower(${secondarySortColumn})`
  const direction = options.order === "desc" ? desc : asc
  const compare = options.order === "desc" ? lt : gt
  const search = options.q?.trim()
  const searchFilter = search
    ? or(
        ilike(issuer.code, `%${search}%`),
        ilike(issuer.isoCode, `%${search}%`),
        ilike(issuer.name, `%${search}%`)
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
            compare(issuer.id, cursor.id)
          )
        )

  return database
    .select({
      ...selection,
      cursorValue: normalizedSortColumn,
      cursorSecondaryValue: normalizedSecondarySortColumn,
    })
    .from(issuer)
    .leftJoin(parentIssuer, eq(issuer.parentIssuerId, parentIssuer.id))
    .where(and(searchFilter, cursorFilter))
    .orderBy(
      direction(normalizedSortColumn),
      direction(normalizedSecondarySortColumn),
      direction(issuer.id)
    )
    .limit(options.limit ?? 30)
}

export async function getIssuerMaintenanceRecordWithDatabase(
  database: typeof db,
  issuerId: string
) {
  const records = await database
    .select(selection)
    .from(issuer)
    .leftJoin(parentIssuer, eq(issuer.parentIssuerId, parentIssuer.id))
    .where(eq(issuer.id, issuerId))
    .limit(1)
  return records.at(0) ?? null
}
