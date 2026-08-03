import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import type { AnyPgColumn } from "drizzle-orm/pg-core"

export const issuerSchemaNames = {
  codeSlugCheck: "issuer_code_slug_check",
  codeUniqueIndex: "issuer_code_unique_idx",
  isoCodeFormatCheck: "issuer_iso_code_format_check",
  parentIssuerIdIndex: "issuer_parent_issuer_id_idx",
  parentIssuerIdCycleCheck: "issuer_parent_issuer_id_cycle_check",
  parentIssuerIdSelfCheck: "issuer_parent_issuer_id_self_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const issuer = pgTable(
  "issuer",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    code: varchar("code", { length: 255 }).notNull(),
    isoCode: varchar("iso_code", { length: 2 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    parentIssuerId: uuid("parent_issuer_id").references(
      (): AnyPgColumn => issuer.id,
      {
        onDelete: "restrict",
      }
    ),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (issuer) => [
    // Issuer codes are lowercase slug-style, so a plain unique index is enough.
    uniqueIndex(issuerSchemaNames.codeUniqueIndex).on(issuer.code),
    // Supports parent-child issuer grouping traversals and joins.
    index(issuerSchemaNames.parentIssuerIdIndex).on(issuer.parentIssuerId),
    // Blocks the trivial issuer-grouping cycle where a row points at itself.
    check(
      issuerSchemaNames.parentIssuerIdSelfCheck,
      sql`${issuer.parentIssuerId} is null or ${issuer.parentIssuerId} <> ${issuer.id}`
    ),
    check(
      issuerSchemaNames.codeSlugCheck,
      sql`${issuer.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
    // Issuer ISO codes are required uppercase ISO 3166-1 alpha-2 values.
    check(
      issuerSchemaNames.isoCodeFormatCheck,
      sql`${issuer.isoCode} ~ '^[A-Z]{2}$'`
    ),
  ]
)

export type Issuer = typeof issuer.$inferSelect
