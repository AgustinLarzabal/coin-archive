import { sql } from "drizzle-orm"
import {
  type AnyPgColumn,
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const issuerSchemaNames = {
  codeSlugCheck: "issuer_code_slug_check",
  codeUniqueIndex: "issuer_code_unique_idx",
  parentIssuerIdIndex: "issuer_parent_issuer_id_idx",
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
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 255 }).notNull(),
    parentIssuerId: uuid("parent_issuer_id").references(
      (): AnyPgColumn => issuer.id,
      {
        onDelete: "restrict",
      }
    ),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (issuer) => [
    uniqueIndex(issuerSchemaNames.codeUniqueIndex).on(issuer.code),
    index(issuerSchemaNames.parentIssuerIdIndex).on(issuer.parentIssuerId),
    check(
      issuerSchemaNames.parentIssuerIdSelfCheck,
      sql`${issuer.parentIssuerId} is null or ${issuer.parentIssuerId} <> ${issuer.id}`
    ),
    check(
      issuerSchemaNames.codeSlugCheck,
      sql`${issuer.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Issuer = typeof issuer.$inferSelect
